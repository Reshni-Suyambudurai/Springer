import React from 'react';

interface FigmaIconProps extends React.HTMLAttributes<SVGSVGElement> {
  className?: string;
  fontSize?: 'small' | 'inherit';
}

/**
 * Figma edit icon — document with pencil overlay.
 * Uses currentColor so CSS classes control the color.
 * Sizes via CSS font-size (renders at 1em × 1em).
 */
export const FigmaEditIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M8 2H3.33333C2.97971 2 2.64057 2.14048 2.39052 2.39052C2.14048 2.64057 2 2.97971 2 3.33333V12.6667C2 13.0203 2.14048 13.3594 2.39052 13.6095C2.64057 13.8595 2.97971 14 3.33333 14H12.6667C13.0203 14 13.3594 13.8595 13.6095 13.6095C13.8595 13.3594 14 13.0203 14 12.6667V8"
      stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.2504 1.75003C12.5156 1.48481 12.8753 1.33582 13.2504 1.33582C13.6255 1.33582 13.9852 1.48481 14.2504 1.75003C14.5156 2.01525 14.6646 2.37496 14.6646 2.75003C14.6646 3.1251 14.5156 3.48481 14.2504 3.75003L8.24172 9.75936C8.08342 9.91753 7.88786 10.0333 7.67305 10.096L5.75772 10.656C5.70036 10.6728 5.63955 10.6738 5.58166 10.6589C5.52377 10.6441 5.47094 10.614 5.42869 10.5717C5.38643 10.5295 5.35631 10.4766 5.34148 10.4188C5.32665 10.3609 5.32766 10.3001 5.34439 10.2427L5.90439 8.32736C5.96741 8.11273 6.08341 7.9174 6.24172 7.75936L12.2504 1.75003Z"
      stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Figma delete/trash icon — outlined trash can with inner lines.
 * Uses currentColor so CSS classes control the color.
 */
export const FigmaDeleteIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M2 4H14" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12.6663 4V13.3333C12.6663 14 11.9997 14.6667 11.333 14.6667H4.66634C3.99967 14.6667 3.33301 14 3.33301 13.3333V4"
      stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5.33301 3.99998V2.66665C5.33301 1.99998 5.99967 1.33331 6.66634 1.33331H9.33301C9.99967 1.33331 10.6663 1.99998 10.6663 2.66665V3.99998"
      stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6.66699 7.33331V11.3333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9.33301 7.33331V11.3333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Figma plus/add icon — simple plus sign.
 * Uses currentColor (white when inside contained buttons).
 */
export const FigmaAddIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M3.33301 8H12.6663" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 3.33331V12.6666" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Figma search icon — magnifying glass.
 * Uses currentColor for stroke.
 */
export const FigmaSearchIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M7.33333 12.6667C10.2789 12.6667 12.6667 10.2789 12.6667 7.33333C12.6667 4.38781 10.2789 2 7.33333 2C4.38781 2 2 4.38781 2 7.33333C2 10.2789 4.38781 12.6667 7.33333 12.6667Z"
      stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14.0005 14L11.1338 11.1333" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Figma close/X icon — two diagonal crossed lines.
 * Used for dialog close buttons.
 */
export const FigmaCloseIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M12 4L4 12" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M4 4L12 12" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/**
 * Figma approve icon — green circled checkmark (qlementine-icons:success-12).
 * Used for approve actions in Document Processing.
 * Hardcoded green (#008236) — use className to override if needed.
 */
export const FigmaApproveIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 20 20" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M14.7499 8.08334C14.9017 7.92617 14.9857 7.71567 14.9838 7.49717C14.9819 7.27868 14.8943 7.06967 14.7398 6.91516C14.5853 6.76065 14.3763 6.67301 14.1578 6.67111C13.9393 6.66921 13.7288 6.75321 13.5716 6.90501L9.15494 11.3217L6.40494 8.57167C6.24777 8.41988 6.03727 8.33588 5.81877 8.33778C5.60027 8.33968 5.39126 8.42732 5.23675 8.58183C5.08225 8.73633 4.99461 8.94534 4.99271 9.16384C4.99081 9.38234 5.0748 9.59284 5.2266 9.75001L8.55994 13.0833C8.71621 13.2396 8.92813 13.3273 9.1491 13.3273C9.37007 13.3273 9.582 13.2396 9.73827 13.0833L14.7383 8.08334H14.7499Z"
      fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M20 10C20 15.5167 15.5167 20 10 20C4.48333 20 0 15.5167 0 10C0 4.48333 4.48333 0 10 0C15.5167 0 20 4.48333 20 10ZM18.3333 10C18.3333 14.6 14.6 18.3333 10 18.3333C5.4 18.3333 1.66667 14.6 1.66667 10C1.66667 5.4 5.4 1.66667 10 1.66667C14.6 1.66667 18.3333 5.4 18.3333 10Z"
      fill="currentColor"/>
  </svg>
);

/**
 * Figma reject icon — red circled X (gg:close-o).
 * Used for reject actions in Document Processing.
 * Hardcoded red (#C10007) — use className to override if needed.
 */
export const FigmaRejectIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 20 20" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M13.4166 7.75727C13.4967 7.68263 13.5612 7.59296 13.6066 7.49337C13.652 7.39379 13.6774 7.28623 13.6812 7.17685C13.685 7.06747 13.6673 6.95841 13.6289 6.85589C13.5906 6.75337 13.5325 6.6594 13.4579 6.57935C13.3832 6.4993 13.2935 6.43473 13.194 6.38933C13.0944 6.34394 12.9868 6.3186 12.8774 6.31477C12.7681 6.31094 12.659 6.32869 12.5565 6.36701C12.454 6.40533 12.36 6.46347 12.2799 6.5381L9.8416 8.81143L7.56827 6.37227C7.41616 6.21647 7.20911 6.1264 6.99143 6.12132C6.77375 6.11624 6.56273 6.19657 6.40352 6.3451C6.24431 6.49364 6.14957 6.69859 6.13955 6.9161C6.12954 7.13361 6.20505 7.3464 6.34993 7.50893L8.62327 9.94727L6.1841 12.2206C6.10122 12.2945 6.03394 12.3842 5.98621 12.4844C5.93848 12.5847 5.91126 12.6934 5.90616 12.8043C5.90105 12.9152 5.91816 13.0261 5.95647 13.1303C5.99479 13.2345 6.05354 13.33 6.12928 13.4111C6.20502 13.4923 6.29622 13.5576 6.39752 13.603C6.49882 13.6484 6.60818 13.6732 6.71918 13.6758C6.83017 13.6784 6.94057 13.6587 7.04388 13.6181C7.14719 13.5774 7.24133 13.5165 7.32077 13.4389L9.7591 11.1664L12.0324 13.6048C12.1058 13.6892 12.1955 13.7579 12.296 13.807C12.3966 13.856 12.506 13.8843 12.6177 13.8901C12.7294 13.896 12.8411 13.8793 12.9462 13.841C13.0514 13.8028 13.1477 13.7437 13.2295 13.6675C13.3113 13.5912 13.377 13.4992 13.4225 13.397C13.468 13.2949 13.4925 13.1846 13.4945 13.0727C13.4964 12.9609 13.4759 12.8498 13.434 12.746C13.3922 12.6423 13.3298 12.5481 13.2508 12.4689L10.9783 10.0306L13.4166 7.75727Z"
      fill="currentColor"/>
    <path fillRule="evenodd" clipRule="evenodd" d="M0.632812 9.98893C0.632812 4.92643 4.73698 0.822266 9.79948 0.822266C14.862 0.822266 18.9661 4.92643 18.9661 9.98893C18.9661 15.0514 14.862 19.1556 9.79948 19.1556C4.73698 19.1556 0.632812 15.0514 0.632812 9.98893ZM9.79948 17.4889C8.81457 17.4889 7.8393 17.2949 6.92935 16.918C6.01941 16.5411 5.19262 15.9887 4.49618 15.2922C3.79974 14.5958 3.24729 13.769 2.87038 12.8591C2.49347 11.9491 2.29948 10.9738 2.29948 9.98893C2.29948 9.00402 2.49347 8.02875 2.87038 7.11881C3.24729 6.20886 3.79974 5.38207 4.49618 4.68563C5.19262 3.98919 6.01941 3.43675 6.92935 3.05984C7.8393 2.68293 8.81457 2.48893 9.79948 2.48893C11.7886 2.48893 13.6963 3.27911 15.1028 4.68563C16.5093 6.09215 17.2995 7.99981 17.2995 9.98893C17.2995 11.9781 16.5093 13.8857 15.1028 15.2922C13.6963 16.6988 11.7886 17.4889 9.79948 17.4889Z"
      fill="currentColor"/>
  </svg>
);

/**
 * Figma chevron-down icon — small dropdown arrow.
 */
export const FigmaChevronDownIcon: React.FC<FigmaIconProps> = ({ className, ...props }) => (
  <svg
    width="1em" height="1em" viewBox="0 0 16 16" fill="none"
    xmlns="http://www.w3.org/2000/svg" className={className} {...props}
  >
    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
