module.exports = function(eleventyConfig) {
    eleventyConfig.setServerPassthroughCopyBehavior("passthrough");
    eleventyConfig.addPassthroughCopy("static");
    eleventyConfig.addPassthroughCopy("static/images/*.png");
    eleventyConfig.addWatchTarget("_site/about");
    eleventyConfig.addWatchTarget("_site/manifesto")
    eleventyConfig.addWatchTarget("_site/tags")
    eleventyConfig.addFilter("hasTag", (tags, tag) => { return (tags || []) .includes(tag); });
	
	eleventyConfig.addPairedShortcode("gallery", galleryShortcode);
	eleventyConfig.addShortcode("galleryImg", galleryImageShortcode);
	eleventyConfig.addPassthroughCopy({
		"./node_modules/photoswipe/dist/photoswipe-lightbox.esm.min.js":
			"/js/photoswipe/photoswipe-lightbox.esm.min.js",
		"./node_modules/photoswipe/dist/photoswipe.esm.min.js":
			"/js/photoswipe/photoswipe.esm.min.js",
		"./node_modules/photoswipe/dist/photoswipe.css":
		  "/css/photoswipe/photoswipe.css",
	});
	
eleventyConfig.addCollection("postsAscending", (collection) => {
  const tagPages = {};
  const posts = collection.getFilteredByGlob(["gallery/*.md", "blog/*.md"])
        .sort((a, b) => a.data.title.localeCompare(b.data.title));
  
  for (const post of posts) {
    for (const tag of post.data.tags) {
      console.log(post.page.url, "has tag", tag);
      tagPages[tag] ||= [];
      tagPages[tag].push(post);
    }
  }

  const paginatedTagPages = [];
  
  const batchSize = 5;

  for (const [tag, posts] of Object.entries(tagPages)) {
    const pages = Math.ceil(posts.length / batchSize);
    for (let i = 0; posts.length > 0; i++) {
      paginatedTagPages.push([tag, posts.splice(0, batchSize), i, pages -1]);
    }
  }

  // Each item in the array returned here is an array whose first
  // element is the tag and second is one to five posts.
  return paginatedTagPages;
});


eleventyConfig.addCollection('tagsList', (collectionApi) => {
  const tagsSet = new Set()
  collectionApi.getAll().forEach((item) => {
    if (!item.data.tags) return
    item.data.tags
      .filter((tag) => !['taglist', 'postsascending' ].includes(tag))
      .forEach((tag) => tagsSet.add(tag))
  })
  return [...tagsSet].sort((a, b) => b.localeCompare(a))
})


const Image = require("@11ty/eleventy-img")
const { Util } = require("@11ty/eleventy-img")
const sharp = require("sharp")

const DEFAULT_GALLERY_IMAGE_WIDTH = 1000;
const LANDSCAPE_LIGHTBOX_IMAGE_WIDTH = 2000;
const PORTRAIT_LIGHTBOX_IMAGE_WIDTH = 720;

async function galleryImageShortcode(
	src,
	alt,
	previewWidth = DEFAULT_GALLERY_IMAGE_WIDTH,
) {
	console.log(src, alt); let lightboxImageWidth = LANDSCAPE_LIGHTBOX_IMAGE_WIDTH;
	src = Util.normalizeImageSource(
		{
			input: this.eleventy.directories.input,
			inputPath: this.page.inputPath,
		},
		src,
	);

	const metadata = await sharp(src).metadata();

	if (metadata.height > metadata.width) {
		lightboxImageWidth = PORTRAIT_LIGHTBOX_IMAGE_WIDTH;
	}

	const options = {
		formats: ["webp"],
		widths: [previewWidth, lightboxImageWidth],
		urlPath: "/static/images/",
		outputDir: this.eleventy.directories.output + "/static/images/",
	};

	const genMetadata = await Image(src, options);
	console.log(genMetadata);
	if (genMetadata.webp.length == 1) {
		genMetadata.webp.splice(0, 0, genMetadata.webp[0]);
	}

	const output = `
        <a href="${genMetadata.webp[0].url}" data-pswp-width="${genMetadata.webp[0].width}" data-pswp-height="${genMetadata.webp[0].height}" target="_blank" style="text-decoration: none">
          <img src="${genMetadata.webp[0].url}" alt="${alt}" eleventy:ignore/>
        </a>
    `.replace(/(\r\n|\n|\r)/gm, "");
	return output;
}

function galleryShortcode(content, name, imgPerCol) {
	if (imgPerCol === undefined) {
		const nImg = (content.match(/<a /g) || []).length;
		imgPerCol = 1;
		if (nImg % 2 == 0) {
			imgPerCol = 2;
		} else if (nImg > 1) {
			imgPerCol = 3;
		}
	}
	return `
				<link rel="stylesheet" href="/css/photoswipe/photoswipe.css">
        <div>
            <div class="eleventy-plugin-gallery" id="gallery-${name}" style="grid-template-columns: repeat(${imgPerCol}, 1fr);">
                ${content}
            </div>
            <script type="module" elventy:ignore eleventy:ignore>
                import PhotoSwipeLightbox from '/js/photoswipe/photoswipe-lightbox.esm.min.js';
                import PhotoSwipe from '/js/photoswipe/photoswipe.esm.min.js';
                const lightbox = new PhotoSwipeLightbox({
                    gallery: '#gallery-${name}',
                    children: 'a',
                    pswpModule: PhotoSwipe,
                    preload: [1, 1]
                });
                lightbox.init();
            </script>
        </div>
    `.replace(/(\r\n|\n|\r)/gm, "");
}}