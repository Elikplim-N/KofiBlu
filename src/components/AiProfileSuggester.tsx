"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { suggestControlProfiles } from '@/ai/flows/suggest-control-profiles';
import { useAppContext } from '@/contexts/app-context';
import { Sparkles, Loader2, BookCopy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AiProfileSuggesterProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function AiProfileSuggester({ open, onOpenChange }: AiProfileSuggesterProps) {
  const { getProfileNames } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [deviceDescription, setDeviceDescription] = useState('');
  const [userProfile, setUserProfile] = useState('');
  const { toast } = useToast();

  const handleSuggest = async () => {
    setIsLoading(true);
    setSuggestions([]);
    
    try {
      const result = await suggestControlProfiles({
        deviceDescription,
        userProfile,
        previousProfiles: getProfileNames(),
      });
      setSuggestions(result.suggestedProfiles);
    } catch (error) {
      console.error('AI profile suggestion failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Suggestion Failed',
        description: 'Could not generate profile suggestions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Profile Suggestions</DialogTitle>
          <DialogDescription>Describe your device and yourself to get profile suggestions.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="device-description">Device Description</Label>
            <Textarea
              id="device-description"
              placeholder="e.g., A 4-wheeled robot with a servo-controlled arm."
              value={deviceDescription}
              onChange={(e) => setDeviceDescription(e.target.value)}
            />
          </div>
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="user-profile">Your Profile/Goal</Label>
            <Input
              id="user-profile"
              placeholder="e.g., A beginner hobbyist trying to test motor speeds."
              value={userProfile}
              onChange={(e) => setUserProfile(e.target.value)}
            />
          </div>
        </div>

        {suggestions.length > 0 && (
            <div className='space-y-2'>
                <h4 className='font-medium'>Suggestions</h4>
                <ul className='space-y-2'>
                    {suggestions.map((name, i) => (
                        <li key={i} className='flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-md border'>
                           <BookCopy className='h-4 w-4 text-primary' />
                           {name}
                        </li>
                    ))}
                </ul>
            </div>
        )}

        <DialogFooter>
          <Button onClick={handleSuggest} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4 text-primary-foreground" />
            )}
            {isLoading ? 'Thinking...' : 'Get Suggestions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
