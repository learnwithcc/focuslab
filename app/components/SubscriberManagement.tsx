import React, { useState } from 'react';
import { useFetcher } from '@remix-run/react';
import { Button } from './Button';
import { Modal } from './Modal';
import type { MailerLiteSubscriber } from '~/services/mailerlite';

interface SubscriberManagementProps {
  className?: string;
}

interface SubscriberListResponse {
  success: boolean;
  data?: {
    data: MailerLiteSubscriber[];
    meta: {
      cursor_next?: string;
      cursor_prev?: string;
      total: number;
    };
  };
  message?: string;
  errors?: Record<string, string>;
}

export const SubscriberManagement: React.FC<SubscriberManagementProps> = ({
  className = ''
}) => {
  const fetcher = useFetcher<SubscriberListResponse>();
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>();
  const [deleteEmail, setDeleteEmail] = useState<string | undefined>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load subscribers on mount and when cursor/status changes
  React.useEffect(() => {
    const formData = new FormData();
    formData.append('limit', '25');
    if (cursor) formData.append('cursor', cursor);
    if (selectedStatus) formData.append('status', selectedStatus);

    fetcher.submit(formData, {
      method: 'POST',
      action: '/api/subscribers'
    });
  }, [cursor, selectedStatus, fetcher]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status === 'all' ? undefined : status);
    setCursor(undefined); // Reset pagination when filter changes
  };

  const handleUnsubscribe = async (email: string) => {
    const formData = new FormData();
    formData.append('email', email);
    formData.append('action', 'unsubscribe');

    fetcher.submit(formData, {
      method: 'PUT',
      action: '/api/subscribers'
    });
  };

  const handleDelete = async () => {
    if (!deleteEmail) return;

    const formData = new FormData();
    formData.append('email', deleteEmail);

    fetcher.submit(formData, {
      method: 'DELETE',
      action: '/api/subscribers'
    });

    setShowDeleteModal(false);
    setDeleteEmail(undefined);
  };

  const confirmDelete = (email: string) => {
    setDeleteEmail(email);
    setShowDeleteModal(true);
  };

  const subscribers = fetcher.data?.data?.data || [];
  const meta = fetcher.data?.data?.meta;
  const isLoading = fetcher.state === 'submitting';

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status filter */}
      <div className="flex gap-2 mb-4">
        <div className="space-y-1">
          <label 
            htmlFor="subscriber-status-filter" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            Filter by Status
          </label>
          <select
            id="subscriber-status-filter"
            value={selectedStatus || 'all'}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            disabled={isLoading}
            aria-describedby="status-filter-help"
          >
            <option value="all">All Subscribers</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
            <option value="bounced">Bounced</option>
            <option value="junk">Junk</option>
            <option value="unconfirmed">Unconfirmed</option>
          </select>
          <div id="status-filter-help" className="sr-only">
            Filter the subscriber list by subscription status. Changes will automatically reload the list.
          </div>
        </div>
      </div>

      {/* Error message */}
      {fetcher.data?.message && !fetcher.data.success && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md" role="alert">
          {fetcher.data.message}
        </div>
      )}

      {/* Subscribers table */}
      <div className="overflow-x-auto">
        <table 
          className="min-w-full divide-y divide-gray-200" 
          role="table"
          aria-label="Newsletter subscribers list"
          aria-describedby="table-description"
        >
          <caption id="table-description" className="sr-only">
            List of newsletter subscribers with their email, status, subscription date, GDPR consent, and available actions.
          </caption>
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subscribed At
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                GDPR Consent
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {subscribers.map((subscriber) => (
              <tr key={subscriber.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {subscriber.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                    ${subscriber.status === 'active' ? 'bg-green-100 text-green-800' :
                      subscriber.status === 'unsubscribed' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'}`}>
                    {subscriber.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(subscriber.subscribed_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {subscriber.fields?.gdpr_consent ? (
                    <span className="text-green-600">✓</span>
                  ) : (
                    <span className="text-red-600">✗</span>
                  )}
                  {subscriber.fields?.consent_timestamp && (
                    <span className="ml-2 text-xs">
                      ({new Date(subscriber.fields.consent_timestamp).toLocaleDateString()})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex gap-2">
                    {subscriber.status === 'active' && (
                      <Button
                        onClick={() => handleUnsubscribe(subscriber.email)}
                        disabled={isLoading}
                        variant="secondary"
                        size="sm"
                        aria-label={`Unsubscribe ${subscriber.email}`}
                      >
                        Unsubscribe
                      </Button>
                    )}
                    <Button
                      onClick={() => confirmDelete(subscriber.email)}
                      disabled={isLoading}
                      variant="danger"
                      size="sm"
                      aria-label={`Delete ${subscriber.email}`}
                      aria-describedby="delete-warning"
                    >
                      Delete
                    </Button>
                    <div id="delete-warning" className="sr-only">
                      This action will permanently delete the subscriber and cannot be undone.
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {meta && (
        <nav 
          className="flex justify-between items-center mt-4" 
          role="navigation" 
          aria-label="Subscriber list pagination"
        >
          <Button
            onClick={() => setCursor(meta.cursor_prev)}
            disabled={!meta.cursor_prev || isLoading}
            variant="secondary"
            aria-label="Go to previous page of subscribers"
          >
            Previous
          </Button>
          <div className="text-sm text-gray-600 dark:text-gray-400" role="status">
            <span className="sr-only">Showing </span>
            Total: {meta.total} subscribers
          </div>
          <Button
            onClick={() => setCursor(meta.cursor_next)}
            disabled={!meta.cursor_next || isLoading}
            variant="secondary"
            aria-label="Go to next page of subscribers"
          >
            Next
          </Button>
        </nav>
      )}

      {/* Delete confirmation modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteEmail(undefined);
        }}
        title="Confirm Deletion"
      >
        <div className="space-y-4">
          <p>
            Are you sure you want to permanently delete this subscriber? This action cannot be undone
            and is in accordance with GDPR&apos;s right to be forgotten.
          </p>
          <p className="font-medium" id="delete-email-display">{deleteEmail}</p>
          <div className="flex justify-end gap-2" role="group" aria-label="Deletion confirmation actions">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteEmail(undefined);
              }}
              variant="secondary"
              aria-describedby="cancel-help"
            >
              Cancel
            </Button>
            <div id="cancel-help" className="sr-only">
              Cancel the deletion and return to the subscriber list without making changes.
            </div>
            <Button
              onClick={handleDelete}
              variant="danger"
              aria-describedby="delete-email-display confirm-delete-help"
            >
              Delete Permanently
            </Button>
            <div id="confirm-delete-help" className="sr-only">
              Confirm permanent deletion of this subscriber. This action cannot be undone.
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}; 