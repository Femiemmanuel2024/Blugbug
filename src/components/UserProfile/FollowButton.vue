<template>
  <button 
    @click="toggleFollow" 
    @mouseover="onMouseOver" 
    @mouseleave="onMouseLeave"
    :class="[{'following': isFollowing }, customClass]">
    <font-awesome-icon :icon="currentIcon" />
  </button>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { supabase } from '../supabase';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'FollowButton',
  components: {
    FontAwesomeIcon,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    customClass: {
      type: String,
      default: ''
    }
  },
  setup(props) {
    const isFollowing = ref(false);
    const buttonText = ref('Follow');
    const originalText = ref('Follow');
    const hoverText = ref('Unfollow');

    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

    const fetchFollowingStatus = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('following_id')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error checking following status:', error.message);
        return;
      }

      if (data && data.following_id) {
        isFollowing.value = data.following_id.includes(props.userId);
        buttonText.value = isFollowing.value ? 'Following' : 'Follow';
        originalText.value = buttonText.value;
      }
    };

    const toggleFollow = async () => {
      const increment = isFollowing.value ? -1 : 1;

      // Fetch and update followers for the searched user
      const { data: searchedUserData, error: searchedUserError } = await supabase
        .from('users')
        .select('followers_id, followers')
        .eq('id', props.userId)
        .single();

      if (searchedUserError) {
        console.error('Error fetching searched user data:', searchedUserError.message);
        return;
      }

      let updatedFollowers = searchedUserData.followers_id || [];
      let followersCount = searchedUserData.followers || 0;

      if (increment === 1) {
        updatedFollowers.push(currentUser.id);
        followersCount += 1;
      } else {
        updatedFollowers = updatedFollowers.filter((id: string) => id !== currentUser.id);
        followersCount -= 1;
      }

      console.log('Updated Followers:', updatedFollowers);
      console.log('Followers Count:', followersCount);

      const { error: updateFollowersError } = await supabase
        .from('users')
        .update({ followers_id: updatedFollowers, followers: followersCount })
        .eq('id', props.userId);

      if (updateFollowersError) {
        console.error('Error updating followers data:', updateFollowersError.message);
        return;
      }

      // Fetch and update following for the current user
      const { data: currentUserData, error: currentUserError } = await supabase
        .from('users')
        .select('following_id, following')
        .eq('id', currentUser.id)
        .single();

      if (currentUserError) {
        console.error('Error fetching current user data:', currentUserError.message);
        return;
      }

      let updatedFollowing = currentUserData.following_id || [];
      let followingCount = currentUserData.following || 0;

      if (increment === 1) {
        updatedFollowing.push(props.userId);
        followingCount += 1;
        buttonText.value = 'Following';
      } else {
        updatedFollowing = updatedFollowing.filter((id: string) => id !== props.userId);
        followingCount -= 1;
        buttonText.value = 'Follow';
      }

      console.log('Updated Following:', updatedFollowing);
      console.log('Following Count:', followingCount);

      const { error: updateFollowingError } = await supabase
        .from('users')
        .update({ following_id: updatedFollowing, following: followingCount })
        .eq('id', currentUser.id);

      if (updateFollowingError) {
        console.error('Error updating following data:', updateFollowingError.message);
        return;
      }

      isFollowing.value = !isFollowing.value;
    };

    const onMouseOver = () => {
      if (isFollowing.value) {
        buttonText.value = hoverText.value;
      }
    };

    const onMouseLeave = () => {
      buttonText.value = originalText.value;
    };

    onMounted(() => {
      fetchFollowingStatus();
    });

    const currentIcon = computed(() => {
      if (isFollowing.value && buttonText.value === 'Following') {
        return ['fas', 'person-walking'];
      } else if (isFollowing.value && buttonText.value === 'Unfollow') {
        return ['fas', 'person-circle-minus'];
      } else {
        return ['fas', 'person-circle-plus'];
      }
    });

    return {
      isFollowing,
      buttonText,
      toggleFollow,
      onMouseOver,
      onMouseLeave,
      currentIcon,
    };
  },
});
</script>

<style scoped>
button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  background-color: #fd662f;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
  font-size: 1.5rem;
}

button.following {
  background-color: #4caf50;
}

button:hover {
  background-color: #e04a2e;
}
</style>
