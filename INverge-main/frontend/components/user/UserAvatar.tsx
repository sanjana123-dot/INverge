'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string;
  profilePicture?: string | null;
  className?: string;
}

export function UserAvatar({ name, profilePicture, className }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <Avatar className={cn('h-16 w-16', className)}>
      {profilePicture ? <AvatarImage src={profilePicture} alt={name} /> : null}
      <AvatarFallback className="text-lg font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
