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
import { suggestControlsBasedOnSerialData, SuggestedControl } from '@/ai/flows/suggest-controls-based-on-serial-data';
import { useAppContext } from '@/contexts/app-context';
import { Sparkles, Loader2, CaseSensitive, Pilcrow, SlidersHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const iconMap = {
    button: <CaseSensitive className="h-6 w-6 text-primary" />,
    slider: <SlidersHorizontal className="h-6 w-6 text-primary" />,
    textInput: <Pilcrow className="h-6 w-6 text-primary" />,
}

export default function AiControlSuggester() {
  const { serialData, addControl } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestedControl[]>([]);
  const { toast } = useToast();

  const handleSuggest = async () => {
    if (serialData.length === 0) {
      toast({
        variant: "destructive",
        title: 'Not enough data',
        description: 'Send or receive some serial data before asking for suggestions.',
      });
      return;
    }
    
    setIsOpen(true);
    setIsLoading(true);
    setSuggestions([]);
    
    try {
      const result = await suggestControlsBasedOnSerialData({ serialData: serialData.join('\n') });
      setSuggestions(result);
    } catch (error) {
      console.error('AI suggestion failed:', error);
      toast({
        variant: "destructive",
        title: 'AI Suggestion Failed',
        description: 'Could not generate suggestions. Please try again.',
      });
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddControl = (suggestion: SuggestedControl) => {
    addControl(suggestion.type, suggestion.purpose);
    toast({
        title: "Control Added",
        description: `A new ${suggestion.type} for "${suggestion.purpose}" has been added to the canvas.`
    })
  }

  return (
    <>
      <Button variant="outline" onClick={handleSuggest}>
        <Sparkles className="mr-2 h-4 w-4 text-primary" />
        Suggest Controls
      </Button>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>AI Control Suggestions</DialogTitle>
            <DialogDescription>Based on the serial data, here are some suggested controls.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
                suggestions.map((suggestion, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                           <CardTitle className="text-sm font-medium capitalize">{suggestion.type}</CardTitle>
                           {iconMap[suggestion.type]}
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-4">{suggestion.purpose}</p>
                            <Button variant="outline" size="sm" onClick={() => handleAddControl(suggestion)}>Add to Canvas</Button>
                        </CardContent>
                    </Card>
                ))
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
