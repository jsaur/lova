import { ButtonHTMLAttributes } from 'react';

export function PrimaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
): React.ReactElement {
  return (
    <button
      {...props}
      className={`px-4 py-2 border rounded-md text-base font-medium text-white bg-gradient-to-r from-green-600 to-yellow-300 ${
        props.disabled
          ? 'cursor-not-allowed'
          : 'hover:from-green-700 hover:to-yellow-400'
      } mt-2 ml-auto ${props.className || ''}`}
    />
  );
}

export function SecondaryButton(
  props: ButtonHTMLAttributes<HTMLButtonElement>
): React.ReactElement {
  return (
    <button
      {...props}
      className={`px-4 py-2 border rounded-md text-base font-medium text-gradient bg-gradient-to-r from-green-600 to-yellow-300 hover:from-green-700 hover:to-yellow-400 outline-none focus:outline-none ${
        props.className || ''
      }`}
    />
  );
}
