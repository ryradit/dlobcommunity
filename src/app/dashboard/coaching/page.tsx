'use client';

import React from 'react';
import CoachingChatGemini from '@/components/CoachingChatGemini';

export default function CoachingPage() {
  return (
    <div className="w-full h-screen">
      <CoachingChatGemini memberName="Player" />
    </div>
  );
}
