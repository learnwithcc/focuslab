import { rateLimit } from 'express-rate-limit';
import { getClientIp } from 'remix-utils/get-client-ip';

// Options for the rate limiter.
const limiterOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
};

/**
 * A rate limiter that can be used as a loader in a Remix route.
 *
 * @example
 * export const loader: LoaderFunction = async ({ request }) => {
 *   await apiLimiter(request);
 *   //...
 * };
 */
export const apiLimiter = async (request: Request) => {
  const ip = getClientIp(request);

  const limiter = rateLimit({
    ...limiterOptions,
    keyGenerator: () => ip || 'unknown',
  });

  // This is a workaround to make express-rate-limit work with Remix
  await new Promise<void>((resolve, reject) => {
    // Create a mock response object
    const res = {
      setHeader: () => {},
      status: () => ({
        send: (message: any) => {
            if (message && message.message) {
                 reject(new Response(message.message, { status: 429 }));
            } else {
                reject(new Response("Too many requests", { status: 429 }));
            }
        },
      }),
      getHeader: () => {},
      send: (message: any) => {
        if (message && message.message) {
            reject(new Response(message.message, { status: 429 }));
        } else {
            reject(new Response("Too many requests", { status: 429 }));
        }
      },
    };

    // We don't need a `next` function because we're not in an Express app
    // and we're not chaining middleware.
    // @ts-ignore
    limiter(request, res, (err?: any) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

/**
 * A stricter rate limiter for form submissions.
 * Limits each IP to 10 requests per minute.
 *
 * @example
 * export const action: ActionFunction = async ({ request }) => {
 *   await formLimiter(request);
 *   //...
 * };
 */
export const formLimiter = async (request: Request) => {
    const ip = getClientIp(request);

    const limiter = rateLimit({
        windowMs: 1 * 60 * 1000, // 1 minute
        max: 10, // Limit each IP to 10 requests per `window`
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: () => ip || 'unknown',
        message: 'Too many form submissions from this IP, please try again after a minute.',
    });

    await new Promise<void>((resolve, reject) => {
        const res = {
          setHeader: () => {},
          status: () => ({
            send: (message: any) => {
                if (message && message.message) {
                    reject(new Response(message.message, { status: 429 }));
                } else if (typeof message === 'string') {
                    reject(new Response(message, { status: 429 }));
                }
                else {
                    reject(new Response("Too many requests", { status: 429 }));
                }
            },
          }),
          getHeader: () => {},
          send: (message: any) => {
            if (message && message.message) {
                reject(new Response(message.message, { status: 429 }));
            } else if (typeof message === 'string') {
                reject(new Response(message, { status: 429 }));
            }
            else {
                reject(new Response("Too many requests", { status: 429 }));
            }
          },
        };
        // @ts-ignore
        limiter(request, res, (err?: any) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}; 