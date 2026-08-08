// 순서 변경 기능을 담당하는 로직 예시
export function useOrderItems(
  leftbar: any[], 
  setLeftbar: React.Dispatch<React.SetStateAction<any[]>>,
  bottom: any[],
  setBottom: React.Dispatch<React.SetStateAction<any[]>>
) {

  // 사이드바 순서 변경 함수 (index를 받아 위나 아래로 이동)
  const moveLeftbarOrder = (index: number, direction: 'up' | 'down') => {
    const newArr = [...leftbar];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // 배열 범위를 벗어나지 않는지 체크
    if (targetIndex < 0 || targetIndex >= newArr.length) return;

    // 두 요소의 자리를 서로 바꿈 (Swap)
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    setLeftbar(newArr);
  };

  // 하단바 순서 변경 함수
  const moveBottomOrder = (index: number, direction: 'up' | 'down') => {
    const newArr = [...bottom];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newArr.length) return;

    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    setBottom(newArr);
  };

  return { moveLeftbarOrder, moveBottomOrder };
}