import { shallowMount } from '@vue/test-utils';
import NavBar from '@/components/NavBar.vue';

describe('NavBar.vue', () => {
  it('renders the correct logo', () => {
    const wrapper = shallowMount(NavBar);
    const logo = wrapper.find('.brandlogo');
    expect(logo.attributes('src')).toBe('/brand_logo.svg');
  });

  it('renders the correct number of nav items', () => {
    const wrapper = shallowMount(NavBar);
    const navItems = wrapper.findAll('.nav-icon');
    expect(navItems.length).toBe(5); 
  });
});
