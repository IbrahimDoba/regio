"use client";

import React from "react";
import FeedCard from "./FeedCard";
import { Post, CategoryColor } from "@/lib/types";

interface FeedListProps {
  posts: Post[];
  activeFilters: CategoryColor[];
  searchQuery: string;
  onOpenPreview: (post: Post) => void;
}

export default function FeedList({ posts, activeFilters, searchQuery, onOpenPreview }: FeedListProps) {
  const filteredPosts = posts.filter(post => {
    if (!activeFilters.includes(post.color)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = post.content['gb'].title.toLowerCase();
      const desc = post.content['gb'].desc.toLowerCase();
      return title.includes(query) || desc.includes(query);
    }
    return true;
  });

  return (
    <div className="p-[10px] bg-[var(--bg-app)] min-h-[calc(100vh-140px)]">
      {filteredPosts.map(post => (
        <FeedCard key={post.id} post={post} onOpenPreview={onOpenPreview} />
      ))}
    </div>
  );
}
