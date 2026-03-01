
'use client';

import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

interface CategoryChipsProps {
  categories: string[];
  selectedCategory: string | null;
  onCategorySelect: (category: string | null) => void;
}

const CategoryChips: FC<CategoryChipsProps> = ({ categories, selectedCategory, onCategorySelect }) => {
  const allCategories = [null, ...categories];

  return (
    <section aria-labelledby="category-filter-heading" className="mb-6 md:mb-8">
      <h2 id="category-filter-heading" className="text-lg font-semibold mb-3">
        Browse by Category
      </h2>
      <ScrollArea className="w-full whitespace-nowrap pb-1">
        <div className="flex space-x-2">
          {allCategories.map((category, index) => (
            <Button
              key={index}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategorySelect(category)}
              className={cn(
                "rounded-full px-4 py-1.5 h-auto text-sm font-medium transition-all duration-200 ease-in-out glass-effect",
                selectedCategory === category
                  ? "bg-primary text-primary-foreground border-primary hover:bg-primary/90"
                  : "border-border/50 hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/20"
              )}
              aria-pressed={selectedCategory === category}
            >
              {category === null ? 'All Events' : category}
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="mt-2" />
      </ScrollArea>
    </section>
  );
};

export default CategoryChips;
