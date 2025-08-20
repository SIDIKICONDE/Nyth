import { Option } from '../constants/options';

export const getSelectedOption = <T extends Option>(
  options: T[],
  selectedId: string
): T => {
  return options.find(option => option.id === selectedId) || options[0];
}; 