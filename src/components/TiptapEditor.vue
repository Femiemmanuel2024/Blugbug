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
                  default: '500px',
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

                const resizeHandle = document.createElement('div');
                resizeHandle.classList.add('resize-handle');

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
      editor.value?.commands.sinkListItem('listItem');
    };

    const outdent = () => {
      editor.value?.commands.liftListItem('listItem');
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

    const resizeImage = (file: File, maxWidth: number): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new window.Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d')!;
            const aspectRatio = img.width / img.height;
            canvas.width = maxWidth;
            canvas.height = maxWidth / aspectRatio;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL(file.type));
          };
          img.src = event.target?.result as string;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const uploadImage = async (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        try {
          const resizedImageUrl = await resizeImage(file, 500);
          editor.value?.chain().focus().setImage({ src: resizedImageUrl }).run();
        } catch (error) {
          console.error('Error resizing image:', error);
        }
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
    };
  },
});
</script>

<style scoped>
.tiptap-container {
  height: 400px;
  background-color: white;
  color: black;
  border: none; /* Remove border */
  padding: 10px;
  overflow-y: auto;
}
.toolbar {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}
.toolbar button {
  background: none; /* Remove background */
  border: none; /* Remove border */
  padding: 5px 10px;
  cursor: pointer;
  color: white; /* Set color to white */
}
.toolbar button i {
  font-size: 16px;
}
.resizable-image-container {
  position: relative;
  display: inline-block;
}
.resize-handle {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background-color: #000;
  cursor: se-resize;
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
