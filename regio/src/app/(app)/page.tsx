"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import FilterPanel from "@/components/feed/FilterPanel";
import FeedList from "@/components/feed/FeedList";
import PreviewModal from "@/components/modals/PreviewModal";
import { posts } from "@/data/mockData";
import { CategoryColor, Post } from "@/lib/types";

export default function FeedPage() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<CategoryColor[]>(['green', 'red', 'blue', 'orange', 'purple', 'turquoise', 'yellow']);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewPost, setPreviewPost] = useState<Post | null>(null);

  const toggleFilter = (color: CategoryColor) => {
    if (activeFilters.includes(color)) {
      setActiveFilters(activeFilters.filter(c => c !== color));
    } else {
      setActiveFilters([...activeFilters, color]);
    }
  };

  return (
    <>
      <Header 
        isFilterOpen={isFilterOpen} 
        toggleFilter={() => setIsFilterOpen(!isFilterOpen)}
        count={posts.length} // In real app, this would be filtered count
        total={posts.length}
      >
        <FilterPanel 
          isOpen={isFilterOpen}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
      </Header>

      <FeedList 
        posts={posts}
        activeFilters={activeFilters}
        searchQuery={searchQuery}
        onOpenPreview={setPreviewPost}
      />

      <PreviewModal 
        post={previewPost} 
        onClose={() => setPreviewPost(null)} 
      />
    </>
  );
}
