/**
 * Debug utilities for the app
 */

export const logTag = (tag: {
  id: string;
  x: number;
  y: number;
  articleId?: string;
  articleTitle?: string;
}) => {
  console.log(
    `Tag ${tag.id.substr(-4)}:`,
    `Position (${tag.x.toFixed(1)}%, ${tag.y.toFixed(1)}%)`,
    tag.articleId ? `Article: ${tag.articleTitle} (${tag.articleId.substr(-4)})` : 'Untagged'
  );
};

export const logOutfitState = (outfitTags: any[]) => {
  console.log(`Current outfit has ${outfitTags.length} tags:`);
  outfitTags.forEach((tag, i) => {
    console.log(
      `${i + 1}. ${tag.id.substr(-4)} at (${tag.x.toFixed(1)}%, ${tag.y.toFixed(
        1
      )}%) ${tag.articleId ? `→ ${tag.articleTitle}` : '(untagged)'}`
    );
  });
};
