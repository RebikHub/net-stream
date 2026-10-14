type Props = {
  onClick: () => void;
  date: string;
  name: string;
  size: string;
  ratio: string;
}

export const SearchMovieItem = ({ onClick, date,name, size, ratio }: Props) => {
  return (
    <li
      onClick={onClick}
    >
      <p>{date}</p>
      <p>{name}</p>
      <p>{ratio}</p>
      <p>{size}</p>
    </li>
  )
}
