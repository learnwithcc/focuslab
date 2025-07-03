import { Link } from '@remix-run/react';
import { ChevronRight } from 'lucide-react';
import type { BreadcrumbItem } from '~/utils/structured-data';

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  // Don't render breadcrumbs if there's only the home item (homepage)
  if (items.length <= 1) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb navigation" 
      className={`flex items-center space-x-2 text-sm text-neutral-600 dark:text-neutral-400 ${className}`}
    >
      <ol className="flex items-center space-x-2" itemScope itemType="https://schema.org/BreadcrumbList">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          
          return (
            <li 
              key={item.path}
              className="flex items-center"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {index > 0 && (
                <ChevronRight 
                  className="h-4 w-4 mx-2 flex-shrink-0 text-neutral-400 dark:text-neutral-500" 
                  aria-hidden="true"
                />
              )}
              
              {isLast ? (
                <span 
                  className="font-medium text-neutral-900 dark:text-neutral-100 py-2"
                  aria-current="page"
                  itemProp="name"
                >
                  {item.name}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 py-2 px-1 min-h-[44px] flex items-center"
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </Link>
              )}
              
              <meta itemProp="position" content={String(index + 1)} />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumb; 