import React from 'react';

export function highlight(text, keyword) {
  if (!keyword) return text;

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");

  return text
    ?.toString()
    .split(regex)
    .map((part, index) =>
      part.toLowerCase() === keyword.toLowerCase()
        ? React.createElement(
            'span',
            { key: index, className: 'search-highlight rounded px-1 font-semibold' },
            part
          )
        : part
    );
}
