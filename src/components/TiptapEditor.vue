<template>
  <div class="blug-editor">
    <div ref="editorContainer" class="tiptap-container"></div>
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
    </div>
    <div v-if="selectedImage" class="resize-options">
      <button @click="resizeImage('small')">
        <i class="fas fa-compress-alt"></i>
      </button>
      <button @click="resizeImage('medium')">
        <i class="fas fa-expand-alt"></i>
      </button>
      <button @click="resizeImage('large')">
        <i class="fas fa-expand"></i>
      </button>
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
                  parseHTML: element => element.style.width.replace('px', ''),
                  renderHTML: attributes => ({
                    style: `width: ${attributes.width}px; height: auto;`,
                  }),
                },
              };
            },
            addNodeView() {
              return ({ node, getPos, editor }) => {
                const dom = document.createElement('div');
                dom.classList.add('resizable-image-container');
                const img = document.createElement('img');
                img.src = node.attrs.src;
                img.style.width = node.attrs.width + 'px';
                img.style.height = 'auto';
                img.style.cursor = 'pointer';

                img.addEventListener('click', () => {
                  selectedImage.value = img;
                  img.style.border = '2px solid green';
                });

                const resizeHandle = document.createElement('div');
                resizeHandle.classList.add('resize-handle');
                resizeHandle.style.position = 'absolute';
                resizeHandle.style.bottom = '0';
                resizeHandle.style.right = '0';
                resizeHandle.style.width = '10px';
                resizeHandle.style.height = '10px';
                resizeHandle.style.backgroundColor = 'red';
                resizeHandle.style.cursor = 'se-resize';

                dom.appendChild(img);
                dom.appendChild(resizeHandle);

                const updateImageSize = (width) => {
                  const transaction = editor.state.tr.setNodeMarkup(getPos(), null, {
                    ...node.attrs,
                    width,
                  });
                  editor.view.dispatch(transaction);
                };

                let startX, startWidth;
                const onMouseMove = (e) => {
                  const newWidth = startWidth + (e.clientX - startX);
                  if (newWidth > 50) {
                    img.style.width = newWidth + 'px';
                  }
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                  updateImageSize(parseInt(img.style.width.replace('px', '')));
                };
                const onMouseDown = (e) => {
                  startX = e.clientX;
                  startWidth = img.clientWidth;
                  document.addEventListener('mousemove', onMouseMove);
                  document.addEventListener('mouseup', onMouseUp);
                };

                resizeHandle.addEventListener('mousedown', onMouseDown);

                return {
                  dom,
                  update: (updatedNode) => {
                    if (updatedNode.type.name !== 'image') return false;
                    img.src = updatedNode.attrs.src;
                    img.style.width = updatedNode.attrs.width + 'px';
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
        placeholder: 'Start Blogging',
        onUpdate({ editor }) {
          emit('updateContent', editor.getHTML(), new Date().toLocaleString());
        },
      });
    });

    onBeforeUnmount(() => {
      editor.value?.destroy();
    });

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

    const resizeImage = async (size: 'small' | 'medium' | 'large') => {
      if (!selectedImage.value) return;
      const maxWidth = size === 'small' ? 500 : size === 'medium' ? 1000 : 1920;
      const aspectRatio = selectedImage.value.naturalWidth / selectedImage.value.naturalHeight;
      const width = Math.min(maxWidth, selectedImage.value.naturalWidth);
      const height = width / aspectRatio;
      selectedImage.value.style.width = `${width}px`;
      selectedImage.value.style.height = 'auto';

      const transaction = editor.value?.state.tr.setNodeMarkup(
        editor.value?.state.selection.anchor - 1,
        null,
        {
          src: selectedImage.value.src,
          width,
        }
      );
      editor.value?.view.dispatch(transaction!);
      selectedImage.value = null;
    };

    const uploadImage = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          const resizedImageUrl = await resizeImageFile(file, 1000); // Resizing image to max 1000px width
          editor.value?.chain().focus().setImage({ src: resizedImageUrl, width: 1000 }).run();
        } catch (error) {
          console.error('Error resizing image:', error);
        }
      }
    };

    const resizeImageFile = (file: File, maxWidth: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = Math.min(maxWidth, img.width);
            const height = width / aspectRatio;
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(file.type));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
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
      resizeImage,
      selectedImage,
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
  overflow-y: auto;
}

.toolbar {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.toolbar button {
  background: none;
  border: none;
  padding: 5px 10px;
  cursor: pointer;
  color: white;
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
  border: 2px solid green;
}

.resize-handle {
  position: absolute;
  bottom: -5px;
  right: -5px;
  width: 10px;
  height: 10px;
  background-color: red;
  cursor: se-resize;
}

.resize-options {
  margin-top: 10px;
}

.resize-options button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px 10px;
  margin-right: 5px;
  color: white;
}

.resize-options button:hover {
  color: #ed6834;
}

.resize-options button i {
  font-size: 16px;
}

::v-deep .tiptap {
  background-color: rgb(255, 255, 255);
  width: 100%;
  height: 400px;
  border: none;
  text-align: left;
  overflow: scroll;
}
</style>
