type Listener = () => void;

/**
 * 진행 중인 일(화면 이동·서버 요청)의 수. 하나라도 있으면 맨 위 로딩 바가 켜진다.
 * React 밖에서도 부를 수 있게 작은 저장소로 둔다(useSyncExternalStore 로 읽는다).
 */
export const createProgressStore = () => {
  let count = 0;
  const listeners = new Set<Listener>();
  const emit = () => listeners.forEach((listener) => listener());

  return {
    start() {
      count += 1;
      emit();
    },
    done() {
      if (count === 0) return;
      count -= 1;
      emit();
    },
    isActive: () => count > 0,
    subscribe(listener: Listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/** 앱 전체가 같이 쓰는 하나 */
export const progress = createProgressStore();
