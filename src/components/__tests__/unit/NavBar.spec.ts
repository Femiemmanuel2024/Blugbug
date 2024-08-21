import { shallowMount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import NavBar from '@/components/NavBar.vue';
import { supabase } from '@/components/supabase';

// Mocking supabase client to avoid real API calls
vi.mock('@/components/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: {
        id: '1',
        full_name: 'John Doe',
        chatter_name: 'johndoe',
        about_me: 'Just a test user',
        email: 'john@example.com',
        profile_image_url: '/path/to/image.jpg',
        header_image_url: '/path/to/header.jpg',
      },
      error: null,
    }),
  },
}));

describe('NavBar.vue', () => {
  it('renders the correct logo', () => {
    const wrapper = shallowMount(NavBar);
    const logo = wrapper.find('.brandlogo');
    expect(logo.attributes('src')).toBe('/brand_logo.svg');
  });

  it('renders the correct number of nav items', () => {
    const wrapper = shallowMount(NavBar);
    const navItems = wrapper.findAll('.nav-icon');
    expect(navItems.length).toBe(5); // Make sure this line ends with a semicolon
  });
});
