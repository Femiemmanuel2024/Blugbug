<template>
  <div class="blug-editor" @click="handleEditorClick">
    <div ref="editorContainer" class="tiptap-container"></div>

    <div class="toolbar-container">
      <div class="toolbar">
        <button @click="toggleBold">
          <i class="fas fa-bold"></i>
        </button>
        <button @click="toggleItalic">
          <i class="fas fa-italic"></i>
        </button>
        <button @click="toggleUnderline">
          <i class="fas fa-underline"></i>
        </button>
        <button @click="toggleAlignLeft">
          <i class="fas fa-align-left"></i>
        </button>
        <button @click="toggleAlignCenter">
          <i class="fas fa-align-center"></i>
        </button>
        <button @click="toggleAlignRight">
          <i class="fas fa-align-right"></i>
        </button>
        <button @click="insertLink">
          <i class="fas fa-link"></i>
        </button>
        <button @click="toggleBulletList">
          <i class="fas fa-list-ul"></i>
        </button>
        <button @click="toggleOrderedList">
          <i class="fas fa-list-ol"></i>
        </button>
        <button @click="indent">
          <i class="fas fa-indent"></i>
        </button>
        <button @click="outdent">
          <i class="fas fa-outdent"></i>
        </button>
        <input type="file" @change="uploadImage" id="imageUpload" style="display: none;" />
        <button @click="triggerImageUpload">
          <i class="fas fa-image"></i>
        </button>

        <!-- Image Resize Buttons (Initially Hidden) -->
        <div v-if="selectedImage" class="image-resize-buttons">
          <button @click="resizeImage('small')">Small</button>
          <button @click="resizeImage('medium')">Medium</button>
          <button @click="resizeImage('large')">Large</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount } from 'vue';
import { Editor } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';

export default defineComponent({
  name: 'TiptapEditor',
  emits: ['updateContent'],
  setup(_, { emit }) {
    const editorContainer = ref<HTMLDivElement | null>(null);
    const editor = ref<Editor | null>(null);
    const selectedImage = ref<HTMLImageElement | null>(null);
    const transformationTool = ref<HTMLDivElement | null>(null);

    onMounted(() => {
      editor.value = new Editor({
        element: editorContainer.value!,
        extensions: [
          StarterKit,
          TextAlign.configure({
            types: ['heading', 'paragraph'],
          }),
          Link.configure({
            openOnClick: false,
            linkOnPaste: true,
            HTMLAttributes: {
              target: '_blank',
              rel: 'noopener noreferrer',
            },
          }),
          Image.extend({
            addAttributes() {
              return {
                ...this.parent?.(),
                width: {
                  default: '1000px',
                  parseHTML: (element) => element.style.width.replace('px', ''),
                  renderHTML: (attributes) => ({
                    style: `width: ${attributes.width}px; height: auto;`,
                  }),
                },
              };
            },
            addNodeView() {
              return ({ node, getPos, editor }) => {
                const dom = document.createElement('div');
                dom.classList.add('resizable-image-container');
                dom.style.position = 'relative';

                const img = document.createElement('img');
                img.src = node.attrs.src;
                img.style.width = node.attrs.width + 'px';
                img.style.height = 'auto';
                img.style.cursor = 'pointer';

                const tool = document.createElement('div');
                tool.style.position = 'absolute';
                tool.style.top = '0';
                tool.style.left = '0';
                tool.style.width = '100%';
                tool.style.height = '100%';
                tool.style.border = '2px solid blue';
                tool.style.display = 'none';
                tool.style.boxSizing = 'border-box';
                tool.style.zIndex = '10';
                transformationTool.value = tool;

                const updateTransformationToolSize = () => {
                  tool.style.width = img.clientWidth + 'px';
                  tool.style.height = img.clientHeight + 'px';
                };

                const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];

                corners.forEach(corner => {
                  const handle = document.createElement('div');
                  handle.style.width = '10px';
                  handle.style.height = '10px';
                  handle.style.backgroundColor = 'red';
                  handle.style.position = 'absolute';
                  handle.style.cursor = 'pointer';

                  switch (corner) {
                    case 'top-left':
                      handle.style.top = '-5px';
                      handle.style.left = '-5px';
                      handle.style.cursor = 'nwse-resize';
                      break;
                    case 'top-right':
                      handle.style.top = '-5px';
                      handle.style.right = '-5px';
                      handle.style.cursor = 'nesw-resize';
                      break;
                    case 'bottom-left':
                      handle.style.bottom = '-5px';
                      handle.style.left = '-5px';
                      handle.style.cursor = 'nesw-resize';
                      break;
                    case 'bottom-right':
                      handle.style.bottom = '-5px';
                      handle.style.right = '-5px';
                      handle.style.cursor = 'nwse-resize';
                      break;
                  }

                  handle.addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    let startX = e.clientX;
                    let startY = e.clientY;
                    let startWidth = img.clientWidth;
                    let startHeight = img.clientHeight;
                    const aspectRatio = startWidth / startHeight;

                    const onMouseMove = (e) => {
                      let newWidth = startWidth + (e.clientX - startX);
                      let newHeight = newWidth / aspectRatio;

                      if (newWidth > 50 && newHeight > 50) {
                        img.style.width = newWidth + 'px';
                        img.style.height = newHeight + 'px';
                        updateTransformationToolSize();
                      }
                    };

                    const onMouseUp = () => {
                      document.removeEventListener('mousemove', onMouseMove);
                      document.removeEventListener('mouseup', onMouseUp);

                      const width = parseInt(img.style.width.replace('px', ''));
                      const transaction = editor.state.tr.setNodeMarkup(getPos(), null, {
                        ...node.attrs,
                        width,
                      });
                      editor.view.dispatch(transaction);
                    };

                    document.addEventListener('mousemove', onMouseMove);
                    document.addEventListener('mouseup', onMouseUp);
                  });

                  tool.appendChild(handle);
                });

                img.addEventListener('click', (e) => {
                  e.stopPropagation();
                  if (tool.style.display === 'block') {
                    tool.style.display = 'none';
                    selectedImage.value = null;
                  } else {
                    if (selectedImage.value) {
                      selectedImage.value.style.border = '';
                    }
                    selectedImage.value = img;
                    tool.style.display = 'block';
                    updateTransformationToolSize();
                  }
                });

                dom.appendChild(img);
                dom.appendChild(tool);

                return {
                  dom,
                  update: (updatedNode) => {
                    if (updatedNode.type.name !== 'image') return false;
                    img.src = updatedNode.attrs.src;
                    img.style.width = updatedNode.attrs.width + 'px';
                    updateTransformationToolSize();
                    return true;
                  },
                };
              };
            },
          }),
          Underline,
          BulletList,
          OrderedList,
          ListItem,
        ],
        content: '',
        onUpdate({ editor }) {
          emit('updateContent', editor.getHTML());
        },
      });

      document.addEventListener('click', handleOutsideClick);
    });

    onBeforeUnmount(() => {
      editor.value?.destroy();
      document.removeEventListener('click', handleOutsideClick);
    });

    const handleOutsideClick = (event: MouseEvent) => {
      if (selectedImage.value && !editorContainer.value?.contains(event.target as Node)) {
        if (transformationTool.value) {
          transformationTool.value.style.display = 'none';
        }
        selectedImage.value = null;
      }
    };

    const handleEditorClick = (event: MouseEvent) => {
      event.stopPropagation();
    };

    const toggleBold = () => {
      editor.value?.chain().focus().toggleBold().run();
    };

    const toggleItalic = () => {
      editor.value?.chain().focus().toggleItalic().run();
    };

    const toggleUnderline = () => {
      editor.value?.chain().focus().toggleUnderline().run();
    };

    const toggleAlignLeft = () => {
      editor.value?.chain().focus().setTextAlign('left').run();
    };

    const toggleAlignCenter = () => {
      editor.value?.chain().focus().setTextAlign('center').run();
    };

    const toggleAlignRight = () => {
      editor.value?.chain().focus().setTextAlign('right').run();
    };

    const toggleBulletList = () => {
      editor.value?.chain().focus().toggleBulletList().run();
    };

    const toggleOrderedList = () => {
      editor.value?.chain().focus().toggleOrderedList().run();
    };

    const indent = () => {
      editor.value?.chain().focus().sinkListItem('listItem').run();
    };

    const outdent = () => {
      editor.value?.chain().focus().liftListItem('listItem').run();
    };

    const insertLink = () => {
      const url = prompt('Enter the URL');
      if (url) {
        editor.value?.chain().focus().setLink({ href: url }).run();
      }
    };

    const triggerImageUpload = () => {
      const imageUpload = document.getElementById('imageUpload') as HTMLInputElement;
      imageUpload.click();
    };

    const uploadImage = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          const resizedImageUrl = await resizeImageFile(file, window.innerWidth * 0.75);
          editor.value?.chain().focus().setImage({ src: resizedImageUrl, width: window.innerWidth * 0.75 }).run();
        } catch (error) {
          console.error('Image resizing failed:', error);
        }
      }
    };

    const resizeImageFile = (file: File, maxWidth: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target?.result as string;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const ratio = img.width / img.height;
            canvas.width = Math.min(maxWidth, img.width);
            canvas.height = canvas.width / ratio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (blob) {
                const resizedImageUrl = URL.createObjectURL(blob);
                resolve(resizedImageUrl);
              } else {
                reject(new Error('Blob creation failed'));
              }
            });
          };
        };
        reader.onerror = () => reject(new Error('File reading failed'));
        reader.readAsDataURL(file);
      });
    };

    const resizeImage = (size: 'small' | 'medium' | 'large') => {
      if (!selectedImage.value) return;

      const aspectRatio = selectedImage.value.naturalWidth / selectedImage.value.naturalHeight;

      let newWidth;
      switch (size) {
        case 'small':
          newWidth = 200;
          break;
        case 'medium':
          newWidth = 500;
          break;
        case 'large':
          newWidth = 1000;
          break;
        default:
          newWidth = selectedImage.value.naturalWidth;
      }

      const newHeight = newWidth / aspectRatio;

      selectedImage.value.style.width = `${newWidth}px`;
      selectedImage.value.style.height = `${newHeight}px`;

      // Update the image in the editor
      const transaction = editor.value?.state.tr.setNodeMarkup(
        editor.value.state.selection.anchor,
        null,
        {
          src: selectedImage.value.src,
          width: newWidth,
        }
      );

      if (transaction) {
        editor.value?.view.dispatch(transaction);
      }
    };

    return {
      editorContainer,
      toggleBold,
      toggleItalic,
      toggleUnderline,
      toggleAlignLeft,
      toggleAlignCenter,
      toggleAlignRight,
      toggleBulletList,
      toggleOrderedList,
      indent,
      outdent,
      insertLink,
      triggerImageUpload,
      uploadImage,
      handleEditorClick,
      resizeImage,
      selectedImage, // Export the selected image ref for reactivity
    };
  },
});
</script>

<style scoped>
.tiptap-container {
  height: 400px;
  background-color: white;
  color: black;
  border: none;
  padding: 10px;
  overflow-y: visible;
  border-radius: 4px;
  caret-color: red;
}

.toolbar-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 10px;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.toolbar button {
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  color: white;
  flex: 1 1 auto;
}

.toolbar button i {
  font-size: 16px;
}

.toolbar button:hover {
  color: orange;
}

.resizable-image-container {
  position: relative;
  display: inline-block;
}

.image-resize-buttons {
  display: flex;
  gap: 5px;
}

.image-resize-buttons button {
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  color: white;
}

.image-resize-buttons button:hover {
  color: orange;
}

::v-deep .tiptap {
  background-color: rgb(255, 255, 255);
  width: 100%;
  height: 400px;
  border: none;
  text-align: left;
  overflow: scroll;
}

@media (max-width: 400px) {
  ::v-deep .tiptap {
    width: 100%;
    height: 700px;
    overflow: scroll;
    text-indent: 2px;
  }

  .tiptap-container {
    height: 330px;
    padding: 10px;
    overflow-y: auto;
  }

  .toolbar button i {
    font-size: 12px;
    margin: 5px;
  }

  .toolbar button {
    flex: 1 1 auto;
  }

  .toolbar-container {
    margin: 0px 5px;
    padding: 0px 9px;
  }
}

@media (min-width: 401px) and (max-width: 768px) {
  ::v-deep .tiptap {
    width: 100%;
    height: 700px;
    overflow: scroll;
    text-indent: 2px;
  }

  .tiptap-container {
    height: 550px;
    padding: 10px;
    overflow-y: auto;
  }
}
</style>
