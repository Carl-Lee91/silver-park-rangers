const SIZES = { sm: "size-4 border-2", lg: "size-6 border-2" };

/** 도는 동그라미. 글자색(currentColor)을 따라가서 어느 단추 위에서도 보인다. */
export default function Spinner({ size = "sm" }: { size?: keyof typeof SIZES }) {
  return (
    <span
      aria-hidden
      className={`inline-block shrink-0 animate-spin rounded-full border-current border-r-transparent align-middle ${SIZES[size]}`}
    />
  );
}
