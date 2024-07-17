import { Image } from '@tiptap/extension-image';
import { mergeAttributes } from '@tiptap/core';

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        parseHTML: (element: HTMLElement) => element.getAttribute('width') || 'auto',
        renderHTML: (attributes: { width: string }) => {
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: 'auto',
        parseHTML: (element: HTMLElement) => element.getAttribute('height') || 'auto',
        renderHTML: (attributes: { height: string }) => {
          return {
            height: attributes.height,
          };
        },
      },
      align: {
        default: 'center',
        parseHTML: (element: HTMLElement) => element.style.float || 'center',
        renderHTML: (attributes: { align: string }) => {
          return {
            style: `float: ${attributes.align};`,
          };
        },
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },
});

export default CustomImage;
