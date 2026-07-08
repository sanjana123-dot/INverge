'use client';

import { useState } from 'react';
import { requestService } from '@/services/request.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { REQUEST_INTENTS } from '@/lib/utils';
import { getApiError } from '@/lib/api';
import { invalidateDashboardCache } from '@/lib/dashboard-cache';
import type { Role } from '@/types';

interface ConnectionRequestCardProps {
  receiverId: string;
  receiverName: string;
  senderRole: Role;
  title?: string;
}

function defaultIntentForRole(role: Role) {
  return role === 'INVESTOR' ? 'INVESTMENT' : 'NETWORKING';
}

export function ConnectionRequestCard({
  receiverId,
  receiverName,
  senderRole,
  title = 'Send connection request',
}: ConnectionRequestCardProps) {
  const [message, setMessage] = useState('');
  const [intent, setIntent] = useState(defaultIntentForRole(senderRole));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const trimmedLength = message.trim().length;
  const canSubmit = trimmedLength >= 10 && !submitting && !success;

  const handleSubmit = async () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage.length < 10) {
      setError('Message must be at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await requestService.create({
        receiverId,
        message: trimmedMessage,
        intent,
      });
      setSuccess(`Connection request sent to ${receiverName}!`);
      setMessage('');
      invalidateDashboardCache();
    } catch (err) {
      setError(getApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-red-600">{error}</p>}
        {success && <p className="text-sm text-emerald-600">{success}</p>}
        <select
          className="h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 dark:border-zinc-700 dark:bg-zinc-900"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
          disabled={Boolean(success)}
        >
          {REQUEST_INTENTS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <div className="space-y-1">
          <Textarea
            placeholder="Introduce yourself and your intent (min 10 characters)..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              if (error) setError('');
            }}
            rows={4}
            disabled={Boolean(success)}
          />
          <p
            className={
              trimmedLength >= 10
                ? 'text-xs text-emerald-600'
                : 'text-xs text-zinc-500'
            }
          >
            {trimmedLength}/10 characters minimum
            {trimmedLength > 0 && trimmedLength < 10
              ? ` — add ${10 - trimmedLength} more to send`
              : ''}
          </p>
        </div>
        <Button onClick={handleSubmit} disabled={!canSubmit}>
          {submitting ? 'Sending…' : success ? 'Request sent' : 'Send request'}
        </Button>
      </CardContent>
    </Card>
  );
}
