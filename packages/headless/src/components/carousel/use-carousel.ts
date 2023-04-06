import {
  type Signal,
  useSignal,
  useVisibleTask$,
  $,
  useId,
} from '@builder.io/qwik';
import type { CarouselContext } from './carousel';

type UseCarouselParams = {
  id?: string;
  ref?: Signal<HTMLElement | undefined>;
  thumbnailsRef?: Signal<HTMLElement | undefined>;
  startAt?: number;
  loop?: boolean;
};

export const useCarousel = (
  params: UseCarouselParams | void
): CarouselContext => {
  const id = params?.id || useId();
  const ref = params?.ref || useSignal();
  const startAt = params?.startAt ?? 0;
  const loop = params?.loop ?? true;

  const isFirstActive = useSignal(false);
  const isLastActive = useSignal(false);
  const count = useSignal(0);
  const active = useSignal(startAt);

  const trackActive = $((index: number) => {
    active.value = index;
    isFirstActive.value = index === 0;
    isLastActive.value = index + 1 === count.value;
  });

  /**
   * scroll to the active item
   * track the active item
   */
  const scrollTo = $((index: number) => {
    if (!count.value) {
      console.warn(
        `Can't jump to ${index} because the carousel elements is empty.`
      );
      return;
    }

    if (index + 1 > count.value) {
      console.warn(
        `Can't jump to ${index} because the element index ${index} doesn't exist.`
      );
      return;
    }

    trackActive(index);

    const element = ref.value?.querySelector('.carousel__items');
    const el = element?.children[index];
    el &&
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'start',
      });
  });

  /**
   * scroll to the -1 of the active item
   */
  const previous = $(() => {
    if (!loop && isFirstActive.value) {
      return;
    }

    scrollTo(active.value === 0 ? count.value - 1 : active.value - 1);
  });

  /**
   * scroll to the +1 of the active item
   */
  const next = $(() => {
    const max = count.value - 1;
    if (!loop && active.value === max) {
      return;
    }

    scrollTo(active.value === max ? 0 : active.value + 1);
  });

  /**
   * initialise the scroll position
   * track the active item when scrolling
   */
  useVisibleTask$(() => {
    // set total of item in the carousel
    const elements = ref.value?.querySelector('.carousel__items');
    count.value = elements?.childElementCount || 0;

    // scroll to the active item on initial render
    scrollTo(active.value);

    // track active item while scrolling
    const observer = new IntersectionObserver((items) => {
      items.forEach((item) => {
        // in case several items shall be handled within
        // the view, use the ratio / number of visible item
        // because several item shall be intersecting
        if (item.isIntersecting) {
          const index = Array.from(elements?.children || []).indexOf(
            item.target
          );
          trackActive(index);
        }
      });
    });

    const items = elements?.children || [];
    Array.from(items).forEach((item) => observer.observe(item));
  });

  return {
    ref,
    id,
    loop,
    startAt,
    active,
    count,
    next,
    previous,
    scrollTo,
    isFirstActive,
    isLastActive,
  };
};
