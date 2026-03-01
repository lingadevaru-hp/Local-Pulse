
'use client';

import type { FC, FormEvent } from 'react';
import { useState, useEffect, useCallback } from 'react';
import Fuse from 'fuse.js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, CheckCircle, RotateCw, ListFilter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import type { City, Event as LocalEvent } from '@/types';
import { cn } from '@/lib/utils';
import { handleGuessCategory } from '@/lib/actions';


interface SearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;

  suggestedQuery: string;
  onSuggestedQueryChange: (query: string) => void;

  selectedCategoryFilter: string | null;
  onCategoryFilterChange: (category: string | null) => void;
  availableCategories: string[];

  selectedDateFilter: string | null;
  onDateFilterChange: (dateFilter: string | null) => void;

  selectedLocationFilter: string | null;
  onLocationFilterChange: (locationId: string | null) => void;
  availableLocations: City[];

  selectedRatingFilter: string | null;
  onRatingFilterChange: (rating: string | null) => void;

  onApplyFilters: () => void;
  onDetectLocation: () => void;
  isLocating: boolean; // Add this prop
  allEvents: LocalEvent[];
}

const dateFilterOptions = [
  { value: 'all', label: 'Any Date' },
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'this_month', label: 'This Month' },
];

const ratingFilterOptions = [
  { value: 'all', label: 'Any Rating' },
  { value: '4', label: '4+ Stars' },
  { value: '3', label: '3+ Stars' },
  { value: '2', label: '2+ Stars' },
];

const SearchBar: FC<SearchBarProps> = ({
  searchQuery,
  onSearchQueryChange,
  suggestedQuery,
  onSuggestedQueryChange,
  selectedCategoryFilter,
  onCategoryFilterChange,
  availableCategories,
  selectedDateFilter,
  onDateFilterChange,
  selectedLocationFilter,
  onLocationFilterChange,
  availableLocations,
  selectedRatingFilter,
  onRatingFilterChange,
  onApplyFilters,
  onDetectLocation,
  isLocating,
  allEvents,
}) => {

  const [applyButtonState, setApplyButtonState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [suggestions, setSuggestions] = useState<LocalEvent[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isAiGuessing, setIsAiGuessing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const fuse = new Fuse(allEvents, {
    keys: ['name', 'category', 'description', 'city', 'organizer'],
    threshold: 0.4, // Adjust threshold for fuzziness (0 = exact match, 1 = match anything)
    includeScore: true,
  });

  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const results = fuse.search(searchQuery.trim());
      setSuggestions(results.map(result => result.item).slice(0, 5)); // Show top 5 suggestions
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allEvents]);

  const handleInputChange = (value: string) => {
    onSearchQueryChange(value);
  };

  const handleSuggestionClick = (suggestionText: string) => {
    onSearchQueryChange(suggestionText);
    setShowSuggestions(false);
    onApplyFilters(); // Optionally apply filter immediately on suggestion click
  };

  const handleAiCategoryGuess = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsAiGuessing(true);
    onSuggestedQueryChange(`Guessing category for "${searchQuery}"...`);
    try {
      const guessedCategory = await handleGuessCategory(searchQuery);
      if (guessedCategory && guessedCategory !== 'Error determining category') {
        onSuggestedQueryChange(`AI thinks this might be: ${guessedCategory}`);
        // Optionally, set category filter if a valid category is returned and matches available ones
        if (availableCategories.map(c => c.toLowerCase()).includes(guessedCategory.toLowerCase())) {
          onCategoryFilterChange(guessedCategory);
        }
      } else if (guessedCategory === 'Error determining category') {
        onSuggestedQueryChange('AI could not determine a category.');
      } else {
        onSuggestedQueryChange('AI could not determine a specific category.');
      }
    } catch (error) {
      console.error('AI Category Guess Error:', error);
      onSuggestedQueryChange('Error guessing category with AI.');
    }
    setIsAiGuessing(false);
  }, [searchQuery, onSuggestedQueryChange, onCategoryFilterChange, availableCategories]);


  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (applyButtonState === 'loading') return;

    setApplyButtonState('loading');
    onApplyFilters();
    setShowSuggestions(false);

    setTimeout(() => {
      setApplyButtonState('success');
      setTimeout(() => setApplyButtonState('idle'), 1500);
    }, 1000);
  };

  return (
    <form onSubmit={handleSubmit} className="glass-effect rounded-2xl p-4 space-y-4 shadow-lg">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative flex-grow">
          <Command className="rounded-lg border shadow-md bg-transparent">
            <div className="relative flex items-center">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <CommandInput
                placeholder="Search events, categories, or locations..."
                value={searchQuery}
                onValueChange={handleInputChange}
                onFocus={() => setShowSuggestions(searchQuery.trim().length > 1 && suggestions.length > 0)}
                className="w-full h-12 pl-10 pr-4 bg-transparent border-none focus:ring-0 text-base rounded-xl"
                aria-label="Search for events by keyword"
                suppressHydrationWarning
              />
            </div>
            {showSuggestions && suggestions.length > 0 && (
              <CommandList className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  {suggestions.map((event) => (
                    <CommandItem
                      key={event.id}
                      onSelect={() => handleSuggestionClick(event.name)}
                      value={event.name}
                      className="cursor-pointer"
                    >
                      {event.name} <span className="text-xs text-muted-foreground ml-2">({event.category})</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary shrink-0"
          onClick={onDetectLocation}
          aria-label="Detect My Location"
        >
          <MapPin className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-primary shrink-0"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          aria-label="Toggle Advanced Filters"
        >
          <ListFilter className="h-5 w-5" />
        </Button>
      </div>

      {suggestedQuery && (
        <p className="text-sm text-muted-foreground italic">{suggestedQuery}</p>
      )}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button
          type="button"
          onClick={handleAiCategoryGuess}
          disabled={isAiGuessing || !searchQuery.trim()}
          variant="secondary"
          size="sm"
          className="rounded-full text-xs shadow-sm"
        >
          {isAiGuessing ? <RotateCw className="mr-2 h-3 w-3 animate-spin" /> : <RotateCw className="mr-2 h-3 w-3" />}
          AI Guess Category
        </Button>
        <Button
          type="button"
          onClick={onDetectLocation}
          disabled={isLocating}
          variant="outline"
          size="sm"
          className="rounded-full text-xs shadow-sm border-primary/20 text-primary hover:bg-primary/5"
        >
          {isLocating ? <RotateCw className="mr-2 h-3 w-3 animate-spin" /> : <MapPin className="mr-2 h-3 w-3" />}
          {isLocating ? 'Locating...' : 'Enable Location'}
        </Button>
      </div>
      {showAdvancedFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-border/20">
          <Select value={selectedCategoryFilter || "all"} onValueChange={(val) => onCategoryFilterChange(val === "all" ? null : val)} aria-label="Filter by category">
            <SelectTrigger className="rounded-full bg-background/70 dark:bg-black/30 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-popover/80 dark:bg-popover/80 backdrop-blur-md">
              <SelectItem value="all">All Categories</SelectItem>
              {availableCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedDateFilter || "all"} onValueChange={(val) => onDateFilterChange(val === "all" ? null : val)} aria-label="Filter by date">
            <SelectTrigger className="rounded-full bg-background/70 dark:bg-black/30 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent className="bg-popover/80 dark:bg-popover/80 backdrop-blur-md">
              {dateFilterOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedLocationFilter || "all"} onValueChange={(val) => onLocationFilterChange(val === "all" ? null : val)} aria-label="Filter by location">
            <SelectTrigger className="rounded-full bg-background/70 dark:bg-black/30 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent className="bg-popover/80 dark:bg-popover/80 backdrop-blur-md">
              <SelectItem value="all">All Locations</SelectItem>
              {availableLocations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedRatingFilter || "all"} onValueChange={(val) => onRatingFilterChange(val === "all" ? null : val)} aria-label="Filter by rating">
            <SelectTrigger className="rounded-full bg-background/70 dark:bg-black/30 backdrop-blur-sm border-border/50">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-popover/80 dark:bg-popover/80 backdrop-blur-md">
              {ratingFilterOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button
        type="submit"
        className={cn(
          "w-full sm:w-auto sm:ml-auto rounded-full h-11 text-base px-8 transition-all duration-300 ease-in-out",
          applyButtonState === 'loading' && 'opacity-70 cursor-not-allowed',
          applyButtonState === 'success' && 'bg-success text-success-foreground animate-pulse-once'
        )}
        aria-label="Apply all selected filters and search query"
        disabled={applyButtonState === 'loading'}
      >
        {applyButtonState === 'loading' && <RotateCw className="mr-2 h-4 w-4 animate-spin" />}
        {applyButtonState === 'success' && <CheckCircle className="mr-2 h-4 w-4" />}
        {applyButtonState === 'idle' && 'Apply Filters'}
        {applyButtonState === 'loading' && 'Applying...'}
        {applyButtonState === 'success' && 'Applied!'}
      </Button>
    </form>
  );
};

export default SearchBar;
