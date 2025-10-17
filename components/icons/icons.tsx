import * as React from 'react';

export interface IconSvgProps {
  size?: number;
  color?: string;
  fill?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const LogoIcon: React.FC<IconSvgProps> = ({
  fill = '#fff',
  ...props
}) => {
  return (
    <svg
      width='122'
      height='31'
      viewBox='0 0 122 31'
      fill={fill || 'none'}
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <g clipPath='url(#clip0_1_111)'>
        <path
          d='M74.9661 6.73635C73.293 7.63529 71.62 8.54161 69.9469 9.44056C69.6641 9.11635 69.2557 8.69635 68.7059 8.26898C68.5409 8.14372 67.0328 6.99424 64.9905 6.53003C62.3592 5.93319 58.9109 6.48582 56.4681 8.71108C54.4808 10.5237 53.9624 12.7048 53.8132 13.6627C53.4126 16.2563 54.3787 18.209 54.583 18.6069C54.7715 18.9827 55.7298 20.7585 57.9291 22.07C60.3719 23.529 62.7833 23.47 63.2468 23.4479C67.1506 23.2932 69.5385 20.7437 69.9626 20.2721C71.6278 21.1711 73.293 22.0774 74.9583 22.9763C72.2169 26.8227 66.5144 29.7258 60.152 28.6206C53.4126 27.4637 48.3148 22.1069 47.9535 15.5563C47.6079 9.18266 51.9673 3.33214 58.5025 1.4753C65.0534 -0.388915 71.5729 2.17529 74.9661 6.73635Z'
          fill='#18AA61'
        />
        <path
          d='M38.0879 4.37109C40.083 4.37109 42.0703 4.37109 44.0654 4.37109C44.0654 11.3637 44.0654 18.3564 44.0654 25.3564C42.3688 25.3564 40.6721 25.3564 38.9755 25.3564C36.0221 21.5764 33.0766 17.7964 30.1232 14.0164C30.1232 17.7964 30.1153 21.5764 30.1153 25.3564C28.1123 25.3564 26.1172 25.3564 24.1143 25.3564C24.1143 18.3637 24.1143 11.3711 24.1064 4.37109C25.9051 4.37109 27.696 4.37109 29.4948 4.37109C32.3618 8.04057 35.2288 11.71 38.0958 15.3795C38.0879 11.71 38.0879 8.04057 38.0879 4.37109Z'
          fill={fill || 'white'}
        />
        <path
          d='M117.649 17.7228C119.118 20.2649 120.595 22.8144 122.063 25.3565C119.77 25.3565 117.468 25.3565 115.175 25.3565C113.965 23.227 112.763 21.0975 111.554 18.968C110.823 18.968 110.093 18.968 109.354 18.968C109.354 21.0975 109.354 23.227 109.354 25.3565C107.289 25.3565 105.223 25.3565 103.165 25.3565C103.165 18.3638 103.165 11.3712 103.165 4.37119C106.354 4.37119 109.543 4.37119 112.732 4.37119C113.29 4.35646 114.044 4.37856 114.916 4.5554C115.842 4.73961 116.502 5.01225 116.651 5.07119C118.356 5.78593 119.338 6.92804 119.534 7.15646C121.058 8.96172 121.137 10.9438 121.152 11.6586C121.168 12.167 121.184 13.0438 120.807 14.0901C120.06 16.1901 118.332 17.3249 117.649 17.7228ZM109.346 14.0459C110.297 14.0459 111.247 14.0459 112.19 14.0459C112.308 14.0533 112.481 14.0533 112.685 14.0238C112.952 13.987 113.729 13.8912 114.303 13.2722C114.908 12.6238 114.876 11.8428 114.861 11.6438C114.853 11.467 114.813 10.9807 114.46 10.5017C114.044 9.92698 113.447 9.72804 113.227 9.66172C112.818 9.52909 112.465 9.52172 112.237 9.52909C111.271 9.52909 110.313 9.52909 109.346 9.52909C109.354 11.0322 109.346 12.5428 109.346 14.0459Z'
          fill={fill || 'white'}
        />
        <path
          d='M0.487071 4.37114C2.5843 4.37114 4.68153 4.37114 6.77875 4.37114C6.78661 8.62272 6.78661 12.8743 6.79446 17.1259C6.77875 17.4648 6.78661 18.1943 7.23433 18.9459C7.58779 19.5353 8.04337 19.8522 8.15334 19.9259C8.56964 20.2132 9.07235 20.3901 9.63789 20.4638C10.2191 20.5448 10.7925 20.5153 11.3502 20.368C11.798 20.2501 12.1986 20.0438 12.5442 19.7785C13.4318 19.0785 13.6124 18.1132 13.6753 17.7743C13.7302 17.4575 13.7302 17.1848 13.7224 17.008C13.7067 12.7932 13.6988 8.57851 13.6831 4.36377C15.796 4.36377 17.9011 4.36377 20.0141 4.36377C20.0141 8.70377 20.0141 13.0438 20.0219 17.3838C20.0298 18.2238 19.9277 20.0069 18.7573 21.8269C17.9718 23.0427 17.0214 23.7869 16.5422 24.1259C15.3954 24.9364 14.3351 25.2606 13.6831 25.4522C13.2982 25.5701 11.9236 25.9532 10.0621 25.9238C9.34727 25.909 7.98053 25.8722 6.36245 25.2975C5.54555 25.0027 3.84892 24.3764 2.4272 22.748C2.0109 22.269 1.01334 21.0164 0.628458 19.1522C0.479217 18.4227 0.463507 17.789 0.479217 17.3469C0.479217 13.0217 0.487071 8.6964 0.487071 4.37114Z'
          fill={fill || 'white'}
        />
        <path
          d='M101.02 25.3564C98.7582 25.3564 96.4961 25.3564 94.2339 25.3564C93.8254 24.2216 93.4091 23.0869 93.0007 21.9522C90.3536 21.9522 87.7066 21.9522 85.0595 21.9522C84.6511 23.0869 84.2347 24.2216 83.8263 25.3564C81.6348 25.3564 79.4433 25.3564 77.2597 25.3564C80.1817 18.3637 83.1115 11.3711 86.0335 4.37109C88.0365 4.37109 90.0316 4.37109 92.0345 4.37109C95.0272 11.3637 98.0277 18.3637 101.02 25.3564ZM91.5083 17.3985C90.6835 15.2469 89.8588 13.1027 89.0262 10.9511C88.2171 13.1027 87.4081 15.2469 86.6069 17.3985C88.2564 17.3985 89.8666 17.3985 91.5083 17.3985Z'
          fill={fill || 'white'}
        />
        <path
          d='M58.6596 14.8711C60.639 14.1121 62.6184 13.3532 64.5978 12.5942C66.2552 12.9479 67.9282 13.3237 69.6249 13.7142C71.2744 14.0974 72.8925 14.4806 74.487 14.8784C72.8925 15.2763 71.2665 15.6742 69.6092 16.0574C67.9125 16.4479 66.2395 16.8163 64.59 17.1627C62.6184 16.3963 60.639 15.6374 58.6596 14.8711Z'
          fill={fill || 'white'}
        />
      </g>
      <defs>
        <clipPath id='clip0_1_111'>
          <rect width='122' height='31' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );
};

export const SlidersIcon: React.FC<IconSvgProps> = ({
  size = 20,
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <g clipPath='url(#clip0_22_1660)'>
        <path
          d='M1.66667 3.33331L8.33333 3.33331'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M11.6667 3.33331L18.3333 3.33331'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M1.66667 10L10 10'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.3333 10L18.3333 10'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M1.66667 16.6667L5.83333 16.6667'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M10 16.6667L18.3333 16.6667'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M8.33333 0.833313L8.33333 5.83331'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M13.3333 7.5L13.3333 12.5'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M5.83333 14.1667L5.83333 19.1667'
          stroke='currentColor'
          strokeWidth='1.5'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </g>
      <defs>
        <clipPath id='clip0_22_1660'>
          <rect width='20' height='20' fill='white' />
        </clipPath>
      </defs>
    </svg>
  );
};

export const HeartIcon: React.FC<IconSvgProps> = ({ size = 20, ...props }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 20 20'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M17.3667 3.84166C16.941 3.41583 16.4357 3.07803 15.8795 2.84757C15.3232 2.6171 14.7271 2.49847 14.125 2.49847C13.5229 2.49847 12.9268 2.6171 12.3705 2.84757C11.8143 3.07803 11.309 3.41583 10.8833 3.84166L10 4.725L9.11666 3.84166C8.25692 2.98192 7.09086 2.49892 5.875 2.49892C4.65914 2.49892 3.49307 2.98192 2.63333 3.84166C1.77359 4.70141 1.29059 5.86747 1.29059 7.08333C1.29059 8.29919 1.77359 9.46525 2.63333 10.325L3.51666 11.2083L10 17.6917L16.4833 11.2083L17.3667 10.325C17.7925 9.89937 18.1303 9.39401 18.3608 8.83779C18.5912 8.28158 18.7099 7.6854 18.7099 7.08333C18.7099 6.48126 18.5912 5.88508 18.3608 5.32887C18.1303 4.77265 17.7925 4.26729 17.3667 3.84166Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export const ShareIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 6.65685 16.3431 8 18 8Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M6 15C7.65685 15 9 13.6569 9 12C9 10.3431 7.65685 9 6 9C4.34315 9 3 10.3431 3 12C3 13.6569 4.34315 15 6 15Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M18 22C19.6569 22 21 20.6569 21 19C21 17.3431 19.6569 16 18 16C16.3431 16 15 17.3431 15 19C15 20.6569 16.3431 22 18 22Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M8.59 13.51L15.42 17.49'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M15.41 6.51001L8.59 10.49'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const ChevronLeftIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M15 18L9 12L15 6'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const ChevronDownIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M18 9L12 15L6 9'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const CalendarIcon: React.FC<IconSvgProps> = ({
  size = 24,
  color = '#0F1013',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 32 32'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M25.3333 5.33337H6.66667C5.19391 5.33337 4 6.52728 4 8.00004V26.6667C4 28.1395 5.19391 29.3334 6.66667 29.3334H25.3333C26.8061 29.3334 28 28.1395 28 26.6667V8.00004C28 6.52728 26.8061 5.33337 25.3333 5.33337Z'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M21.333 2.66663V7.99996'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10.667 2.66663V7.99996'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4 13.3334H28'
      stroke={color}
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const EditIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M17 3C17.2626 2.73735 17.5744 2.52901 17.9176 2.38687C18.2608 2.24473 18.6286 2.17157 19 2.17157C19.3714 2.17157 19.7392 2.24473 20.0824 2.38687C20.4256 2.52901 20.7374 2.73735 21 3C21.2626 3.26264 21.471 3.57444 21.6131 3.9176C21.7553 4.26077 21.8284 4.62856 21.8284 5C21.8284 5.37143 21.7553 5.73923 21.6131 6.08239C21.471 6.42555 21.2626 6.73735 21 7L7.5 20.5L2 22L3.5 16.5L17 3Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const StarIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const FacebookIcon: React.FC<IconSvgProps> = ({
  size = 20,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M13.3333 1.66699H11.3333C10.4493 1.66699 9.60143 2.10598 8.97631 2.88738C8.35119 3.66878 8 4.72859 8 5.83366V8.33366H6V11.667H8V18.3337H10.6667V11.667H12.6667L13.3333 8.33366H10.6667V5.83366C10.6667 5.61265 10.7369 5.40068 10.8619 5.2444C10.987 5.08812 11.1565 5.00033 11.3333 5.00033H13.3333V1.66699Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const InstagramIcon: React.FC<IconSvgProps> = ({
  size = 20,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_1_120)'>
      <path
        d='M14.168 1.66699H5.83464C3.53345 1.66699 1.66797 3.53247 1.66797 5.83366V14.167C1.66797 16.4682 3.53345 18.3337 5.83464 18.3337H14.168C16.4692 18.3337 18.3346 16.4682 18.3346 14.167V5.83366C18.3346 3.53247 16.4692 1.66699 14.168 1.66699Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M13.3337 9.47525C13.4366 10.1688 13.3181 10.8771 12.9952 11.4994C12.6723 12.1218 12.1614 12.6264 11.5351 12.9416C10.9088 13.2569 10.1991 13.3666 9.5069 13.2552C8.81468 13.1438 8.17521 12.817 7.67944 12.3212C7.18367 11.8255 6.85685 11.186 6.74546 10.4938C6.63408 9.80154 6.74379 9.09183 7.05901 8.46556C7.37423 7.8393 7.8789 7.32837 8.50123 7.00545C9.12356 6.68254 9.83187 6.56407 10.5254 6.66692C11.2328 6.77182 11.8878 7.10147 12.3935 7.60717C12.8992 8.11288 13.2288 8.76782 13.3337 9.47525Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M14.582 5.41699H14.5904'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_1_120'>
        <rect width='20' height='20' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const TwitterIcon: React.FC<IconSvgProps> = ({
  size = 20,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M19.1667 2.50008C18.3687 3.06298 17.4851 3.4935 16.55 3.77508C16.0481 3.198 15.3811 2.78899 14.6392 2.60335C13.8973 2.41771 13.1163 2.46441 12.4017 2.73712C11.6872 3.00984 11.0737 3.49541 10.6442 4.12818C10.2146 4.76094 9.98976 5.51036 10 6.27508V7.10841C8.53554 7.14639 7.0844 6.82159 5.77585 6.16295C4.4673 5.50431 3.34194 4.53228 2.50001 3.33341C2.50001 3.33341 -0.833323 10.8334 6.66668 14.1667C4.95045 15.3317 2.90597 15.9159 0.833344 15.8334C8.33334 20.0001 17.5 15.8334 17.5 6.25008C17.4992 6.01796 17.4769 5.78641 17.4333 5.55841C18.2838 4.71966 18.884 3.66067 19.1667 2.50008Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const SearchIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M11 19C15.4183 19 19 15.4182 19 11C19 6.58169 15.4183 2.99997 11 2.99997C6.58172 2.99997 3 6.58169 3 11C3 15.4182 6.58172 19 11 19Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M21.0004 21L16.6504 16.65'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const CarIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M3 8L5.72187 10.2682C5.90158 10.418 6.12811 10.5 6.36205 10.5H17.6379C17.8719 10.5 18.0984 10.418 18.2781 10.2682L21 8M6.5 14H6.51M17.5 14H17.51M8.16065 4.5H15.8394C16.5571 4.5 17.2198 4.88457 17.5758 5.50772L20.473 10.5777C20.8183 11.1821 21 11.8661 21 12.5623V18.5C21 19.0523 20.5523 19.5 20 19.5H19C18.4477 19.5 18 19.0523 18 18.5V17.5H6V18.5C6 19.0523 5.55228 19.5 5 19.5H4C3.44772 19.5 3 19.0523 3 18.5V12.5623C3 11.8661 3.18166 11.1821 3.52703 10.5777L6.42416 5.50772C6.78024 4.88457 7.44293 4.5 8.16065 4.5ZM7 14C7 14.2761 6.77614 14.5 6.5 14.5C6.22386 14.5 6 14.2761 6 14C6 13.7239 6.22386 13.5 6.5 13.5C6.77614 13.5 7 13.7239 7 14ZM18 14C18 14.2761 17.7761 14.5 17.5 14.5C17.2239 14.5 17 14.2761 17 14C17 13.7239 17.2239 13.5 17.5 13.5C17.7761 13.5 18 13.7239 18 14Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const LocationIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const PeopleIcon: React.FC<IconSvgProps> = ({ size = 20, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const BarChartIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 52 52'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M39 43.3334V21.6667'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M26 43.3334V8.66669'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13 43.3333V30.3333'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const GlobeIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 53 52'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M26.3329 47.6666C38.2991 47.6666 47.9996 37.9661 47.9996 26C47.9996 14.0338 38.2991 4.33331 26.3329 4.33331C14.3668 4.33331 4.66626 14.0338 4.66626 26C4.66626 37.9661 14.3668 47.6666 26.3329 47.6666Z'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4.66626 26H47.9996'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M26.3329 4.33331C31.7524 10.2664 34.8322 17.9661 34.9996 26C34.8322 34.0339 31.7524 41.7335 26.3329 47.6666C20.9135 41.7335 17.8336 34.0339 17.6663 26C17.8336 17.9661 20.9135 10.2664 26.3329 4.33331Z'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const EngineIcon: React.FC<IconSvgProps> = ({ size = 33, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 33 33'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_319_1138)'>
      <path
        d='M28.6666 5.83331H4.66661C3.19385 5.83331 1.99994 7.02722 1.99994 8.49998V28.5C1.99994 29.9727 3.19385 31.1666 4.66661 31.1666H28.6666C30.1394 31.1666 31.3333 29.9727 31.3333 28.5V8.49998C31.3333 7.02722 30.1394 5.83331 28.6666 5.83331Z'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M31.3333 13.8333H1.99994'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M26 19.1667H7.33331'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M11.3333 19.1667V23.1667C11.3333 24.6395 12.5272 25.8334 14 25.8334H31.3333'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M28.6666 5.83331V3.16665C28.6666 2.43027 28.0697 1.83331 27.3333 1.83331H24.6666C23.9302 1.83331 23.3333 2.43027 23.3333 3.16665V5.83331'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M19.3333 5.83331V3.16665C19.3333 2.43027 18.7363 1.83331 17.9999 1.83331H15.3333C14.5969 1.83331 13.9999 2.43027 13.9999 3.16665V5.83331'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M9.99996 5.83331V3.16665C9.99996 2.43027 9.403 1.83331 8.66663 1.83331H5.99996C5.26359 1.83331 4.66663 2.43027 4.66663 3.16665V5.83331'
        stroke='currentColor'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_319_1138'>
        <rect
          width='32'
          height='32'
          fill='white'
          transform='translate(0.666626 0.5)'
        />
      </clipPath>
    </defs>
  </svg>
);

export const SettingsIcon: React.FC<IconSvgProps> = ({
  size = 33,
  color = '#0F1013',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_1377_8449)'>
      <path
        d='M10 12.5C11.3807 12.5 12.5 11.3807 12.5 10C12.5 8.61929 11.3807 7.5 10 7.5C8.61929 7.5 7.5 8.61929 7.5 10C7.5 11.3807 8.61929 12.5 10 12.5Z'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M16.1663 12.5C16.0554 12.7513 16.0223 13.0301 16.0713 13.3005C16.1204 13.5708 16.2492 13.8202 16.4413 14.0166L16.4913 14.0666C16.6463 14.2214 16.7692 14.4052 16.8531 14.6076C16.937 14.8099 16.9802 15.0268 16.9802 15.2458C16.9802 15.4648 16.937 15.6817 16.8531 15.884C16.7692 16.0864 16.6463 16.2702 16.4913 16.425C16.3366 16.5799 16.1527 16.7029 15.9504 16.7867C15.7481 16.8706 15.5312 16.9138 15.3122 16.9138C15.0931 16.9138 14.8763 16.8706 14.6739 16.7867C14.4716 16.7029 14.2878 16.5799 14.133 16.425L14.083 16.375C13.8866 16.1829 13.6372 16.054 13.3668 16.005C13.0965 15.956 12.8177 15.989 12.5663 16.1C12.3199 16.2056 12.1097 16.381 11.9616 16.6046C11.8135 16.8282 11.7341 17.0902 11.733 17.3583V17.5C11.733 17.942 11.5574 18.3659 11.2449 18.6785C10.9323 18.991 10.5084 19.1666 10.0663 19.1666C9.62431 19.1666 9.20039 18.991 8.88783 18.6785C8.57527 18.3659 8.39967 17.942 8.39967 17.5V17.425C8.39322 17.1491 8.30394 16.8816 8.14343 16.6572C7.98293 16.4328 7.75862 16.2619 7.49967 16.1666C7.24833 16.0557 6.96951 16.0226 6.69918 16.0716C6.42885 16.1207 6.17941 16.2495 5.98301 16.4416L5.93301 16.4916C5.77822 16.6466 5.5944 16.7695 5.39207 16.8534C5.18974 16.9373 4.97287 16.9805 4.75384 16.9805C4.53481 16.9805 4.31794 16.9373 4.11561 16.8534C3.91328 16.7695 3.72946 16.6466 3.57467 16.4916C3.41971 16.3369 3.29678 16.153 3.21291 15.9507C3.12903 15.7484 3.08586 15.5315 3.08586 15.3125C3.08586 15.0935 3.12903 14.8766 3.21291 14.6742C3.29678 14.4719 3.41971 14.2881 3.57467 14.1333L3.62467 14.0833C3.81679 13.8869 3.94566 13.6375 3.99468 13.3671C4.04369 13.0968 4.0106 12.818 3.89967 12.5666C3.79404 12.3202 3.61864 12.11 3.39506 11.9619C3.17149 11.8138 2.9095 11.7344 2.64134 11.7333H2.49967C2.05765 11.7333 1.63372 11.5577 1.32116 11.2452C1.0086 10.9326 0.833008 10.5087 0.833008 10.0666C0.833008 9.62462 1.0086 9.2007 1.32116 8.88813C1.63372 8.57557 2.05765 8.39998 2.49967 8.39998H2.57467C2.8505 8.39353 3.11801 8.30424 3.34242 8.14374C3.56684 7.98323 3.73777 7.75893 3.83301 7.49998C3.94394 7.24863 3.97703 6.96982 3.92801 6.69949C3.879 6.42916 3.75012 6.17971 3.55801 5.98331L3.50801 5.93331C3.35305 5.77852 3.23012 5.59471 3.14624 5.39238C3.06237 5.19005 3.0192 4.97317 3.0192 4.75415C3.0192 4.53512 3.06237 4.31824 3.14624 4.11591C3.23012 3.91358 3.35305 3.72977 3.50801 3.57498C3.6628 3.42002 3.84661 3.29709 4.04894 3.21321C4.25127 3.12934 4.46815 3.08617 4.68717 3.08617C4.9062 3.08617 5.12308 3.12934 5.32541 3.21321C5.52774 3.29709 5.71155 3.42002 5.86634 3.57498L5.91634 3.62498C6.11274 3.81709 6.36219 3.94597 6.63252 3.99498C6.90285 4.044 7.18166 4.01091 7.43301 3.89998H7.49967C7.74615 3.79434 7.95635 3.61894 8.10442 3.39537C8.25248 3.17179 8.33194 2.9098 8.33301 2.64165V2.49998C8.33301 2.05795 8.5086 1.63403 8.82116 1.32147C9.13372 1.00891 9.55765 0.833313 9.99967 0.833313C10.4417 0.833313 10.8656 1.00891 11.1782 1.32147C11.4907 1.63403 11.6663 2.05795 11.6663 2.49998V2.57498C11.6674 2.84313 11.7469 3.10513 11.8949 3.3287C12.043 3.55228 12.2532 3.72768 12.4997 3.83331C12.751 3.94424 13.0298 3.97733 13.3002 3.92832C13.5705 3.8793 13.8199 3.75043 14.0163 3.55831L14.0663 3.50831C14.2211 3.35335 14.4049 3.23042 14.6073 3.14655C14.8096 3.06267 15.0265 3.0195 15.2455 3.0195C15.4645 3.0195 15.6814 3.06267 15.8837 3.14655C16.0861 3.23042 16.2699 3.35335 16.4247 3.50831C16.5796 3.6631 16.7026 3.84692 16.7864 4.04925C16.8703 4.25158 16.9135 4.46845 16.9135 4.68748C16.9135 4.90651 16.8703 5.12338 16.7864 5.32571C16.7026 5.52804 16.5796 5.71186 16.4247 5.86665L16.3747 5.91665C16.1826 6.11305 16.0537 6.36249 16.0047 6.63282C15.9557 6.90315 15.9887 7.18197 16.0997 7.43331V7.49998C16.2053 7.74645 16.3807 7.95666 16.6043 8.10472C16.8279 8.25279 17.0899 8.33224 17.358 8.33331H17.4997C17.9417 8.33331 18.3656 8.50891 18.6782 8.82147C18.9907 9.13403 19.1663 9.55795 19.1663 9.99998C19.1663 10.442 18.9907 10.8659 18.6782 11.1785C18.3656 11.4911 17.9417 11.6666 17.4997 11.6666H17.4247C17.1565 11.6677 16.8945 11.7472 16.671 11.8952C16.4474 12.0433 16.272 12.2535 16.1663 12.5Z'
        stroke={color}
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_1377_8449'>
        <rect width='20' height='20' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const ClockIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 6V12L16 14'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const UsersIcon: React.FC<IconSvgProps> = ({ size = 32, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 32 33'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M22.6667 28.5V25.8333C22.6667 24.4188 22.1048 23.0623 21.1046 22.0621C20.1044 21.0619 18.7478 20.5 17.3333 20.5H6.66668C5.25219 20.5 3.89563 21.0619 2.89544 22.0621C1.89525 23.0623 1.33334 24.4188 1.33334 25.8333V28.5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 15.1667C14.9455 15.1667 17.3333 12.7789 17.3333 9.83333C17.3333 6.88781 14.9455 4.5 12 4.5C9.05447 4.5 6.66666 6.88781 6.66666 9.83333C6.66666 12.7789 9.05447 15.1667 12 15.1667Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M30.6667 28.5V25.8333C30.6658 24.6516 30.2725 23.5037 29.5485 22.5698C28.8245 21.6358 27.8108 20.9688 26.6667 20.6733'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M21.3333 4.67334C22.4806 4.96707 23.4974 5.63427 24.2235 6.56975C24.9497 7.50523 25.3438 8.65578 25.3438 9.84001C25.3438 11.0242 24.9497 12.1748 24.2235 13.1103C23.4974 14.0457 22.4806 14.7129 21.3333 15.0067'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const FuelIcon: React.FC<IconSvgProps> = ({ size = 33, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 33 33'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M3.33331 17.9492C3.33331 15.1541 3.33331 13.7565 4.07098 12.6966C4.80865 11.6367 6.10261 11.175 8.69051 10.2516L19.3572 6.44569C24.2052 4.71593 26.629 3.85105 28.3145 5.07008C30 6.28911 30 8.90719 30 14.1433V21.6779C30 25.5224 30 27.4447 28.8284 28.6389C27.6568 29.8333 25.7712 29.8333 22 29.8333H11.3333C7.56207 29.8333 5.67646 29.8333 4.50489 28.6389C3.33331 27.4447 3.33331 25.5224 3.33331 21.6779V17.9492Z'
      stroke='currentColor'
      strokeWidth='1.5'
    />
    <path
      d='M12.6666 19.1667C12.6666 17.2811 12.6666 16.3383 13.2524 15.7524C13.8382 15.1667 14.781 15.1667 16.6666 15.1667C18.5522 15.1667 19.495 15.1667 20.0809 15.7524C20.6666 16.3383 20.6666 17.2811 20.6666 19.1667C20.6666 21.0523 20.6666 21.9951 20.0809 22.581C19.495 23.1667 18.5522 23.1667 16.6666 23.1667C14.781 23.1667 13.8382 23.1667 13.2524 22.581C12.6666 21.9951 12.6666 21.0523 12.6666 19.1667Z'
      stroke='currentColor'
      strokeWidth='1.5'
    />
    <path
      d='M20.6666 15.1666L22 13.8333'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M12.6666 15.1666L11.3333 13.8333'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M20.6666 23.1667L22 24.5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M12.6666 23.1667L11.3333 24.5'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
    <path
      d='M7.33331 9.91343C7.33331 8.17339 7.33331 7.30337 7.78418 6.70402C7.90025 6.54973 8.03566 6.41161 8.18693 6.29321C8.7745 5.83331 9.62745 5.83331 11.3333 5.83331H12.4242C13.1006 5.83331 13.4387 5.83331 13.7162 5.90914C14.4692 6.11494 15.0572 6.71482 15.2589 7.48282'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
    />
  </svg>
);

export const GearshiftIcon: React.FC<IconSvgProps> = ({
  size = 33,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 33 33'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_319_7174)'>
      <path
        d='M29.6667 26.1456V16.5V6.85437C31.1751 6.59844 32.3334 5.27831 32.3334 3.7C32.3334 1.94 30.8934 0.5 29.1334 0.5C27.3734 0.5 25.9334 1.94 25.9334 3.7C25.9334 5.27831 27.0917 6.59844 28.6001 6.85437V15.9667H21.1334V6.85437C22.6417 6.59844 23.8001 5.27831 23.8001 3.7C23.8001 1.94 22.3601 0.5 20.6001 0.5C18.8401 0.5 17.4001 1.94 17.4001 3.7C17.4001 5.27831 18.5584 6.59844 20.0667 6.85437V15.9667H12.6001V6.85437C14.1084 6.59844 15.2667 5.27831 15.2667 3.7C15.2667 1.94 13.8267 0.5 12.0667 0.5C10.3067 0.5 8.86675 1.94 8.86675 3.7C8.86675 5.27831 10.0251 6.59844 11.5334 6.85437V15.9667H4.06669V6.85437C5.57506 6.59844 6.73337 5.27831 6.73337 3.7C6.73337 1.94 5.29337 0.5 3.53337 0.5C1.77337 0.5 0.333374 1.94 0.333374 3.7C0.333374 5.27831 1.49169 6.59844 3.00006 6.85437V16.5C3.00006 16.82 3.21337 17.0333 3.53337 17.0333H11.5334V26.1456C10.025 26.4016 8.86669 27.7217 8.86669 29.3C8.86669 31.06 10.3067 32.5 12.0667 32.5C13.8267 32.5 15.2667 31.06 15.2667 29.3C15.2667 27.7217 14.1084 26.4016 12.6 26.1456V17.0333H20.0667V26.1456C18.5583 26.4016 17.4 27.7217 17.4 29.3C17.4 31.06 18.84 32.5 20.6 32.5C22.36 32.5 23.8 31.06 23.8 29.3C23.8 27.7217 22.6417 26.4016 21.1333 26.1456V17.0333H28.6V26.1456C27.0916 26.4016 25.9333 27.7217 25.9333 29.3C25.9333 31.06 27.3733 32.5 29.1333 32.5C30.8933 32.5 32.3333 31.06 32.3333 29.3C32.3334 27.7217 31.1751 26.4016 29.6667 26.1456ZM27.0001 3.7C27.0001 2.52669 27.9601 1.56669 29.1334 1.56669C30.3067 1.56669 31.2667 2.52669 31.2667 3.7C31.2667 4.87331 30.3067 5.83331 29.1334 5.83331C27.9601 5.83331 27.0001 4.87331 27.0001 3.7ZM18.4667 3.7C18.4667 2.52669 19.4267 1.56669 20.6 1.56669C21.7733 1.56669 22.7333 2.52669 22.7333 3.7C22.7333 4.87331 21.7733 5.83331 20.6 5.83331C19.4267 5.83331 18.4667 4.87331 18.4667 3.7ZM9.93337 3.7C9.93337 2.52669 10.8934 1.56669 12.0667 1.56669C13.24 1.56669 14.2 2.52669 14.2 3.7C14.2 4.87331 13.24 5.83331 12.0667 5.83331C10.8934 5.83331 9.93337 4.87331 9.93337 3.7ZM1.40006 3.7C1.40006 2.52669 2.36006 1.56669 3.53337 1.56669C4.70669 1.56669 5.66669 2.52669 5.66669 3.7C5.66669 4.87331 4.70669 5.83331 3.53337 5.83331C2.36006 5.83331 1.40006 4.87331 1.40006 3.7ZM14.2001 29.3C14.2001 30.4733 13.2401 31.4333 12.0667 31.4333C10.8934 31.4333 9.93344 30.4733 9.93344 29.3C9.93344 28.1267 10.8934 27.1667 12.0667 27.1667C13.2401 27.1667 14.2001 28.1267 14.2001 29.3ZM22.7334 29.3C22.7334 30.4733 21.7734 31.4333 20.6001 31.4333C19.4267 31.4333 18.4667 30.4733 18.4667 29.3C18.4667 28.1267 19.4267 27.1667 20.6001 27.1667C21.7734 27.1667 22.7334 28.1267 22.7334 29.3ZM29.1334 31.4333C27.9601 31.4333 27.0001 30.4733 27.0001 29.3C27.0001 28.1267 27.9601 27.1667 29.1334 27.1667C30.3067 27.1667 31.2667 28.1267 31.2667 29.3C31.2667 30.4733 30.3067 31.4333 29.1334 31.4333Z'
        fill='currentColor'
      />
    </g>
    <defs>
      <clipPath id='clip0_319_7174'>
        <rect
          width='32'
          height='32'
          fill='white'
          transform='translate(0.333374 0.5)'
        />
      </clipPath>
    </defs>
  </svg>
);

export const CheckCircleIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M22 4L12 14.01L9 11.01'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const XIcon = ({ size = 24, className }: IconSvgProps) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    className={className}
  >
    <path
      d='M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M15 9L9 15'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M9 9L15 15'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const ClosedIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    className='h-6 w-6'
    fill='none'
    stroke='currentColor'
    viewBox='0 0 24 24'
    {...props}
  >
    <path
      strokeLinecap='round'
      strokeLinejoin='round'
      strokeWidth={2}
      d='M6 18L18 6M6 6l12 12'
    />
  </svg>
);

export const LinkIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M10 13C10.4295 13.5741 10.9774 14.0491 11.6066 14.3929C12.2357 14.7367 12.9315 14.9411 13.6467 14.9913C14.3618 15.0415 15.0796 14.9357 15.7513 14.6828C16.4231 14.4299 17.0337 14.0357 17.54 13.53L20.54 10.53C21.4508 9.59695 21.9548 8.33395 21.9434 7.02696C21.932 5.71996 21.4058 4.46691 20.479 3.54007C19.5521 2.61324 18.2991 2.08703 16.9921 2.07564C15.6851 2.06424 14.4221 2.56821 13.489 3.479L11.999 4.929'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M14 11C13.5705 10.4259 13.0226 9.95085 12.3934 9.60705C11.7642 9.26325 11.0684 9.05889 10.3533 9.00869C9.63816 8.95849 8.92037 9.0643 8.24865 9.3172C7.57692 9.5701 6.96632 9.96431 6.46 10.47L3.46 13.47C2.54921 14.403 2.04525 15.666 2.05664 16.973C2.06803 18.28 2.59424 19.5331 3.52107 20.4599C4.44791 21.3868 5.70096 21.913 7.00795 21.9244C8.31495 21.9358 9.57795 21.4318 10.511 20.521L12.001 19.071'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const TelegramIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M21.5 4.5L2.5 10.5L9.5 13.5L14.5 8.5L9.5 13.5L12.5 20.5L21.5 4.5Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const HomeIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 25 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M3.125 9L12.125 2L21.125 9V20C21.125 20.5304 20.9143 21.0391 20.5392 21.4142C20.1641 21.7893 19.6554 22 19.125 22H5.125C4.59457 22 4.08586 21.7893 3.71079 21.4142C3.33571 21.0391 3.125 20.5304 3.125 20V9Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M9.125 22V12H15.125V22'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const UserIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 25 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M20.625 21V19C20.625 17.9391 20.2036 16.9217 19.4534 16.1716C18.7033 15.4214 17.6859 15 16.625 15H8.625C7.56413 15 6.54672 15.4214 5.79657 16.1716C5.04643 16.9217 4.625 17.9391 4.625 19V21'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12.625 11C14.8332 11 16.625 9.20812 16.625 7C16.625 4.79188 14.8332 3 12.625 3C10.4169 3 8.625 4.79188 8.625 7C8.625 9.20812 10.4169 11 12.625 11Z'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const MenuIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 25 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M3.875 12H21.875'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M3.875 6H21.875'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M3.875 18H21.875'
      stroke='currentColor'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const AudiIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_691_4298)'>
      <path
        d='M63.2786 29.7846C63.1364 29.0789 62.9176 28.3842 62.6386 27.7169C62.3651 27.0659 62.0205 26.4369 61.6266 25.8461C61.2328 25.2608 60.7788 24.7138 60.281 24.216C59.7832 23.7182 59.2362 23.2642 58.6509 22.8704C58.0601 22.4711 57.4365 22.1319 56.7801 21.8584C56.1183 21.5794 55.4235 21.3606 54.7124 21.2184C53.9849 21.0707 53.241 20.9941 52.4971 20.9941C51.7531 20.9941 51.0037 21.0707 50.2817 21.2184C49.576 21.3606 48.8813 21.5794 48.214 21.8584C47.563 22.1319 46.934 22.4765 46.3432 22.8704C46.1189 23.0181 45.9056 23.1822 45.6923 23.3463C45.4789 23.1822 45.2656 23.0235 45.0413 22.8704C44.4506 22.4711 43.827 22.1319 43.1706 21.8584C42.5087 21.5794 41.814 21.3606 41.1029 21.2184C40.3808 21.0707 39.6314 20.9941 38.8875 20.9941C38.1435 20.9941 37.3941 21.0707 36.6721 21.2184C35.9665 21.3606 35.2718 21.5794 34.6044 21.8584C33.9535 22.1319 33.3244 22.4765 32.7336 22.8704C32.4984 23.029 32.2687 23.1986 32.0444 23.3736C31.8201 23.1986 31.5904 23.029 31.3606 22.8704C30.7699 22.4711 30.1463 22.1319 29.4899 21.8584C28.828 21.5794 28.1333 21.3606 27.4222 21.2184C26.7001 21.0707 25.9507 20.9941 25.2068 20.9941C24.4629 20.9941 23.7135 21.0707 22.9914 21.2184C22.2858 21.3606 21.5911 21.5794 20.9237 21.8584C20.2728 22.1319 19.6437 22.4765 19.053 22.8704C18.8177 23.029 18.5935 23.1931 18.3747 23.3682C18.1559 23.1931 17.9261 23.029 17.6964 22.8704C17.1056 22.4711 16.482 22.1319 15.8256 21.8584C15.1637 21.5794 14.469 21.3606 13.7579 21.2184C13.0359 21.0707 12.2865 20.9941 11.5425 20.9941C10.7986 20.9941 10.0492 21.0707 9.32714 21.2184C8.6215 21.3606 7.9268 21.5794 7.25945 21.8584C6.60851 22.1319 5.97945 22.4765 5.38868 22.8704C4.80338 23.2642 4.25637 23.7182 3.75859 24.216C3.26082 24.7138 2.8068 25.2608 2.41295 25.8461C2.03552 26.4369 1.69637 27.0659 1.42287 27.7169C1.14389 28.3788 0.925089 29.0735 0.782867 29.7846C0.635175 30.5066 0.558594 31.256 0.558594 32C0.558594 32.7439 0.635175 33.4933 0.782867 34.2153C0.925089 34.921 1.14389 35.6157 1.42287 36.2776C1.69637 36.9285 2.04099 37.5576 2.43483 38.1483C2.82868 38.7282 3.2827 39.2806 3.78047 39.7784C4.27825 40.2762 4.82526 40.7302 5.41056 41.1241C6.00133 41.5234 6.62492 41.8625 7.28133 42.136C7.94321 42.415 8.63791 42.6338 9.34902 42.776C10.0711 42.9237 10.8205 43.0003 11.5644 43.0003C12.3083 43.0003 13.0577 42.9237 13.7798 42.776C14.4854 42.6338 15.1801 42.415 15.8475 42.136C16.4984 41.8625 17.1275 41.5179 17.7182 41.1241C17.948 40.9654 18.1777 40.8013 18.3965 40.6263C18.6153 40.8013 18.8451 40.9654 19.0748 41.1241C19.6656 41.5234 20.2892 41.8625 20.9456 42.136C21.6075 42.415 22.3022 42.6338 23.0078 42.776C23.7299 42.9237 24.4793 43.0003 25.2232 43.0003C25.9671 43.0003 26.7165 42.9237 27.4386 42.776C28.1442 42.6338 28.8389 42.415 29.5063 42.136C30.1572 41.8625 30.7863 41.5179 31.3771 41.1241C31.6123 40.9654 31.842 40.7959 32.0663 40.6208C32.2906 40.7959 32.5203 40.9654 32.7555 41.1241C33.3463 41.5234 33.9699 41.8625 34.6263 42.136C35.2882 42.415 35.9829 42.6338 36.694 42.776C37.416 42.9237 38.1654 43.0003 38.9094 43.0003C39.6533 43.0003 40.4027 42.9237 41.1247 42.776C41.8304 42.6338 42.5251 42.415 43.1924 42.136C43.8434 41.8625 44.4724 41.5179 45.0632 41.1241C45.2875 40.9764 45.5008 40.8123 45.7141 40.6482C45.9275 40.8123 46.1408 40.9709 46.3651 41.1241C46.9559 41.5234 47.5794 41.8625 48.2359 42.136C48.8977 42.415 49.5924 42.6338 50.2981 42.776C51.0201 42.9237 51.7695 43.0003 52.5135 43.0003C53.2574 43.0003 54.0068 42.9237 54.7288 42.776C55.4345 42.6338 56.1292 42.415 56.7965 42.136C57.4475 41.8625 58.0765 41.5179 58.6673 41.1241C59.2526 40.7302 59.7996 40.2762 60.2974 39.7784C60.7952 39.2806 61.2492 38.7336 61.643 38.1483C62.0424 37.5576 62.3815 36.934 62.655 36.2776C62.934 35.6157 63.1528 34.921 63.295 34.2099C63.4427 33.4823 63.5193 32.7384 63.5193 31.9945C63.5029 31.256 63.4263 30.5066 63.2786 29.7846ZM6.76167 24.8888C7.22116 24.577 7.708 24.3145 8.21671 24.0957C8.73637 23.8769 9.27791 23.7073 9.82492 23.5979C10.3883 23.483 10.9736 23.4229 11.5535 23.4229C12.1333 23.4229 12.7186 23.483 13.282 23.5979C13.8345 23.7128 14.376 23.8769 14.8902 24.0957C15.3989 24.309 15.8912 24.577 16.3453 24.8888C16.4437 24.9545 16.5422 25.0256 16.6406 25.0967C16.4437 25.3374 16.2577 25.589 16.0882 25.8461C15.6888 26.4369 15.3497 27.0605 15.0762 27.7169C14.7972 28.3788 14.5784 29.0735 14.4362 29.7846C14.2885 30.5066 14.2119 31.256 14.2119 32C14.2119 32.7439 14.2885 33.4933 14.4362 34.2153C14.5784 34.921 14.7972 35.6157 15.0762 36.2776C15.3497 36.9285 15.6943 37.5576 16.0882 38.1483C16.2632 38.4054 16.4492 38.657 16.6461 38.8977C16.5477 38.9688 16.4492 39.04 16.3453 39.1111C15.8858 39.4229 15.3989 39.6854 14.8902 39.9042C14.3706 40.123 13.829 40.2926 13.282 40.402C12.7186 40.5169 12.1333 40.577 11.5535 40.577C10.9736 40.577 10.3883 40.5169 9.82492 40.402C9.27244 40.2871 8.7309 40.123 8.21671 39.9042C7.708 39.6909 7.22116 39.4229 6.76167 39.1111C6.30765 38.8047 5.88099 38.4492 5.49261 38.0663C5.10423 37.6779 4.75415 37.2512 4.44782 36.7972C4.13603 36.3377 3.87347 35.8509 3.65466 35.3422C3.43586 34.8225 3.26629 34.281 3.15688 33.734C3.04201 33.1706 2.98184 32.5853 2.98184 32.0054C2.98184 31.4256 3.04201 30.8403 3.15688 30.2769C3.27176 29.7244 3.43586 29.1829 3.65466 28.6687C3.868 28.16 4.13603 27.6676 4.44782 27.2136C4.75415 26.7596 5.1097 26.3329 5.49261 25.9446C5.88099 25.5507 6.30765 25.1952 6.76167 24.8888ZM18.1066 36.7972C17.7948 36.3377 17.5323 35.8509 17.3135 35.3422C17.0947 34.8225 16.9251 34.281 16.8157 33.734C16.7008 33.1706 16.6406 32.5853 16.6406 32.0054C16.6406 31.4256 16.7008 30.8403 16.8157 30.2769C16.9306 29.7244 17.0947 29.1829 17.3135 28.6687C17.5268 28.16 17.7948 27.6676 18.1066 27.2136C18.1941 27.0823 18.2926 26.9511 18.3911 26.8198C18.4895 26.9511 18.5825 27.0823 18.6755 27.2136C18.9873 27.6731 19.2499 28.16 19.4687 28.6687C19.6875 29.1883 19.8571 29.7299 19.9665 30.2769C20.0813 30.8403 20.1415 31.4256 20.1415 32.0054C20.1415 32.5853 20.0813 33.1706 19.9665 33.734C19.8516 34.2865 19.6875 34.828 19.4687 35.3422C19.2553 35.8509 18.9873 36.3432 18.6755 36.7972C18.588 36.9285 18.4895 37.0598 18.3911 37.1911C18.2926 37.0653 18.1941 36.934 18.1066 36.7972ZM20.683 38.1538C21.0824 37.563 21.4215 36.9394 21.695 36.283C21.974 35.6212 22.1928 34.9265 22.335 34.2153C22.4827 33.4933 22.5593 32.7439 22.5593 32C22.5593 31.256 22.4827 30.5066 22.335 29.7846C22.1928 29.0789 21.974 28.3842 21.695 27.7169C21.4215 27.0659 21.0769 26.4369 20.683 25.8461C20.508 25.589 20.322 25.3374 20.1251 25.0967C20.2235 25.0256 20.322 24.9545 20.4205 24.8888C20.88 24.577 21.3668 24.3145 21.8755 24.0957C22.3952 23.8769 22.9367 23.7073 23.4837 23.5979C24.0471 23.483 24.6324 23.4229 25.2123 23.4229C25.7921 23.4229 26.3774 23.483 26.9408 23.5979C27.4933 23.7128 28.0348 23.8769 28.549 24.0957C29.0577 24.309 29.55 24.577 30.0041 24.8888C30.108 24.96 30.2119 25.0311 30.3104 25.1076C30.1189 25.3483 29.9329 25.5945 29.7634 25.8461C29.3641 26.4369 29.0249 27.0605 28.7514 27.7169C28.4724 28.3788 28.2536 29.0735 28.1114 29.7846C27.9637 30.5066 27.8871 31.256 27.8871 32C27.8871 32.7439 27.9637 33.4933 28.1114 34.2153C28.2536 34.921 28.4724 35.6157 28.7514 36.2776C29.0249 36.9285 29.3695 37.5576 29.7634 38.1483C29.9384 38.4054 30.1189 38.6516 30.3159 38.8923C30.2119 38.9688 30.1135 39.04 30.0041 39.1111C29.5446 39.4229 29.0577 39.6854 28.549 39.9042C28.0294 40.123 27.4878 40.2926 26.9408 40.402C26.3774 40.5169 25.7921 40.577 25.2123 40.577C24.6324 40.577 24.0471 40.5169 23.4837 40.402C22.9312 40.2871 22.3897 40.123 21.8755 39.9042C21.3668 39.6909 20.88 39.4229 20.4205 39.1111C20.322 39.0454 20.2181 38.9743 20.1251 38.8977C20.322 38.6625 20.508 38.4109 20.683 38.1538ZM31.7818 36.7972C31.47 36.3377 31.2075 35.8509 30.9887 35.3422C30.7699 34.8225 30.6003 34.281 30.4909 33.734C30.376 33.1706 30.3159 32.5853 30.3159 32.0054C30.3159 31.4256 30.376 30.8403 30.4909 30.2769C30.6058 29.7244 30.7699 29.1829 30.9887 28.6687C31.202 28.16 31.47 27.6676 31.7818 27.2136C31.8694 27.0823 31.9624 26.9565 32.0553 26.8307C32.1483 26.9565 32.2413 27.0823 32.3288 27.2136C32.6406 27.6731 32.9032 28.16 33.122 28.6687C33.3408 29.1883 33.5104 29.7299 33.6198 30.2769C33.7347 30.8403 33.7948 31.4256 33.7948 32.0054C33.7948 32.5853 33.7347 33.1706 33.6198 33.734C33.5049 34.2865 33.3408 34.828 33.122 35.3422C32.9087 35.8509 32.6406 36.3432 32.3288 36.7972C32.2413 36.9285 32.1483 37.0543 32.0553 37.1801C31.9624 37.0543 31.8694 36.9285 31.7818 36.7972ZM34.3418 38.1538C34.7412 37.563 35.0803 36.9394 35.3538 36.283C35.6328 35.6212 35.8516 34.9265 35.9938 34.2153C36.1415 33.4933 36.2181 32.7439 36.2181 32C36.2181 31.256 36.1415 30.5066 35.9938 29.7846C35.8516 29.0789 35.6328 28.3842 35.3538 27.7169C35.0803 27.0659 34.7357 26.4369 34.3418 25.8461C34.1723 25.589 33.9863 25.3429 33.7948 25.1022C33.8933 25.0256 33.9972 24.9545 34.1012 24.8834C34.5606 24.5716 35.0475 24.309 35.5562 24.0902C36.0759 23.8714 36.6174 23.7018 37.1644 23.5924C37.7278 23.4776 38.3131 23.4174 38.8929 23.4174C39.4728 23.4174 40.0581 23.4776 40.6215 23.5924C41.174 23.7073 41.7155 23.8714 42.2297 24.0902C42.7384 24.3035 43.2307 24.5716 43.6847 24.8834C43.7723 24.9435 43.8598 25.0037 43.9418 25.0639C43.7394 25.3155 43.548 25.5726 43.3675 25.8406C42.9682 26.4314 42.629 27.055 42.3555 27.7114C42.0765 28.3733 41.8577 29.068 41.7155 29.7791C41.5678 30.5012 41.4912 31.2506 41.4912 31.9945C41.4912 32.7384 41.5678 33.4878 41.7155 34.2099C41.8577 34.9155 42.0765 35.6102 42.3555 36.2721C42.629 36.923 42.9736 37.5521 43.3675 38.1429C43.548 38.4109 43.7394 38.668 43.9473 38.9196C43.8598 38.9853 43.7723 39.0454 43.6847 39.1056C43.2253 39.4174 42.7384 39.68 42.2297 39.8988C41.71 40.1176 41.1685 40.2871 40.6215 40.3965C40.0581 40.5114 39.4728 40.5716 38.8929 40.5716C38.3131 40.5716 37.7278 40.5114 37.1644 40.3965C36.6119 40.2817 36.0704 40.1176 35.5562 39.8988C35.0475 39.6854 34.5606 39.4174 34.1012 39.1056C33.9972 39.0345 33.8933 38.9634 33.7948 38.8868C33.9863 38.657 34.1668 38.4054 34.3418 38.1538ZM45.3859 36.7972C45.0741 36.3377 44.8116 35.8509 44.5928 35.3422C44.374 34.8225 44.2044 34.281 44.095 33.734C43.9801 33.1706 43.92 32.5853 43.92 32.0054C43.92 31.4256 43.9801 30.8403 44.095 30.2769C44.2099 29.7244 44.374 29.1829 44.5928 28.6687C44.8061 28.16 45.0741 27.6676 45.3859 27.2136C45.4844 27.0659 45.5883 26.9237 45.6977 26.7815C45.8071 26.9237 45.9111 27.0659 46.0095 27.2136C46.3213 27.6731 46.5839 28.16 46.8027 28.6687C47.0215 29.1883 47.1911 29.7299 47.3005 30.2769C47.4153 30.8403 47.4755 31.4256 47.4755 32.0054C47.4755 32.5853 47.4153 33.1706 47.3005 33.734C47.1856 34.2865 47.0215 34.828 46.8027 35.3422C46.5894 35.8509 46.3213 36.3432 46.0095 36.7972C45.9111 36.9449 45.8071 37.0871 45.6977 37.2294C45.5883 37.0871 45.4844 36.9449 45.3859 36.7972ZM48.0171 38.1538C48.4164 37.563 48.7555 36.9394 49.029 36.283C49.308 35.6212 49.5268 34.9265 49.669 34.2153C49.8167 33.4933 49.8933 32.7439 49.8933 32C49.8933 31.256 49.8167 30.5066 49.669 29.7846C49.5268 29.0789 49.308 28.3842 49.029 27.7169C48.7555 27.0659 48.4109 26.4369 48.0171 25.8461C47.8365 25.5781 47.6451 25.321 47.4427 25.0694C47.5302 25.0092 47.6177 24.9435 47.7053 24.8834C48.1647 24.5716 48.6516 24.309 49.1603 24.0902C49.68 23.8714 50.2215 23.7018 50.7685 23.5924C51.3319 23.4776 51.9172 23.4174 52.4971 23.4174C53.0769 23.4174 53.6622 23.4776 54.2256 23.5924C54.7781 23.7073 55.3196 23.8714 55.8338 24.0902C56.3425 24.3035 56.8348 24.5716 57.2889 24.8834C57.7429 25.1897 58.1695 25.5453 58.5579 25.9336C58.9463 26.322 59.2964 26.7487 59.6027 27.2027C59.9145 27.6622 60.1771 28.149 60.3959 28.6577C60.6147 29.1774 60.7842 29.7189 60.8936 30.2659C61.0085 30.8294 61.0687 31.4147 61.0687 31.9945C61.0687 32.5743 61.0085 33.1596 60.8936 33.723C60.7788 34.2755 60.6147 34.817 60.3959 35.3312C60.1825 35.84 59.9145 36.3323 59.6027 36.7863C59.2964 37.2403 58.9408 37.667 58.5579 38.0553C58.175 38.4437 57.7429 38.7938 57.2889 39.1001C56.8294 39.4119 56.3425 39.6745 55.8338 39.8933C55.3141 40.1121 54.7726 40.2817 54.2256 40.3911C53.6622 40.5059 53.0769 40.5661 52.4971 40.5661C51.9172 40.5661 51.3319 40.5059 50.7685 40.3911C50.216 40.2762 49.6745 40.1121 49.1603 39.8933C48.6516 39.68 48.1647 39.4119 47.7053 39.1001C47.6177 39.04 47.5302 38.9798 47.4427 38.9141C47.6451 38.6789 47.8365 38.4218 48.0171 38.1538Z'
        fill='#595959'
      />
    </g>
    <defs>
      <clipPath id='clip0_691_4298'>
        <rect width={size} height={size} fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const BMWIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_455_12726)'>
      <path
        d='M32 0C14.328 0 0 14.328 0 32C0 49.672 14.328 64 32 64C49.672 64 64 49.672 64 32C64 14.328 49.672 0 32 0ZM32 2.08C48.5227 2.08 61.9173 15.4747 61.9173 32C61.9173 48.5227 48.5253 61.9173 32 61.9173C15.4747 61.9173 2.08267 48.5227 2.08267 32C2.08267 15.4773 15.4773 2.08 32 2.08ZM30.192 3.76C29.312 3.79733 28.432 3.872 27.5467 3.968L27.2613 11.8187C27.8892 11.7124 28.5208 11.6288 29.1547 11.568L29.3413 6.26667L29.3067 5.90133L29.4213 6.248L31.192 10.2187H32.808L34.5787 6.25067L34.6853 5.90133L34.6587 6.26667L34.8453 11.568C35.464 11.6267 36.1067 11.712 36.7387 11.8187L36.448 3.968C35.5688 3.86893 34.6865 3.79955 33.8027 3.76L32.0613 8.09333L32 8.41333L31.9387 8.09333L30.192 3.76ZM48.048 8.624L43.9333 15.0987C44.4533 15.4987 45.1387 16.088 45.5787 16.4907L49.4533 14.48L49.6987 14.296L49.5147 14.5467L47.5093 18.4213C47.944 18.888 48.5707 19.6427 48.9227 20.1013L55.4027 15.984C55.0053 15.4699 54.5963 14.9649 54.176 14.4693L50.072 17.1733L49.792 17.4187L50 17.112L51.8133 13.496L50.5333 12.216L46.9173 14.0293L46.6107 14.2373L46.8533 13.9547L49.568 9.85067C49.088 9.44533 48.632 9.07467 48.048 8.624ZM14.6667 10.0933C13.7067 10.192 12.9653 10.848 10.952 13.0933C10.2539 13.8845 9.58064 14.6974 8.93333 15.5307L14.464 20.776C16.296 18.7493 17.04 17.9973 18.4853 16.4747C19.5067 15.3947 20.0853 14.1547 19.0613 12.9627C18.5067 12.3173 17.5733 12.176 16.7947 12.496L16.72 12.5227L16.7467 12.4533C16.8428 12.0995 16.8327 11.7252 16.7174 11.3771C16.6022 11.029 16.387 10.7225 16.0987 10.496C15.8983 10.338 15.6685 10.2213 15.4227 10.1526C15.1769 10.084 14.9199 10.0621 14.6667 10.0933ZM14.6827 11.7333C15.0453 11.6347 15.4213 11.8933 15.504 12.2667C15.5893 12.64 15.3547 12.992 15.0933 13.2853C14.5067 13.952 12.344 16.2133 12.344 16.2133L11.272 15.192C12.384 13.832 13.568 12.5947 14.104 12.104C14.2648 11.9364 14.4631 11.8093 14.6827 11.7333ZM32 13.0213C27.3024 13.0193 22.7711 14.7602 19.2833 17.9071C15.7956 21.0539 13.5994 25.3829 13.12 30.056V30.0613C12.8187 33.0261 13.2193 36.0202 14.2894 38.8015C15.3595 41.5828 17.0691 44.0733 19.2799 46.0715C21.4908 48.0697 24.1408 49.5197 27.0158 50.304C29.8908 51.0884 32.91 51.1852 35.8293 50.5867C40.1085 49.707 43.9527 47.3771 46.7125 43.9906C49.4722 40.6041 50.9782 36.3686 50.976 32C50.9711 26.969 48.9701 22.1455 45.4124 18.5883C41.8547 15.0311 37.031 13.0309 32 13.0267V13.0213ZM17.2347 13.6667C17.36 13.6667 17.4907 13.7013 17.608 13.7813C17.8427 13.9387 17.9493 14.208 17.8907 14.4747C17.8213 14.792 17.5573 15.0907 17.344 15.3227L14.5573 18.3093L13.4373 17.2427C13.4373 17.2427 15.536 15.024 16.224 14.312C16.496 14.0293 16.672 13.8587 16.8587 13.7653C16.9743 13.7053 17.1045 13.6716 17.2347 13.6667ZM32 15.5147C34.1656 15.5122 36.3104 15.9369 38.3116 16.7645C40.3128 17.5921 42.1311 18.8063 43.6624 20.3376C45.1937 21.8689 46.4079 23.6872 47.2355 25.6884C48.0631 27.6896 48.4878 29.8344 48.4853 32H32V48.4853C29.8344 48.4878 27.6896 48.0631 25.6884 47.2355C23.6872 46.4079 21.8689 45.1937 20.3376 43.6624C18.8063 42.1311 17.5921 40.3128 16.7645 38.3116C15.9369 36.3104 15.5122 34.1656 15.5147 32H32V15.5147Z'
        fill='#595959'
      />
    </g>
    <defs>
      <clipPath id='clip0_455_12726'>
        <rect width='64' height='64' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const ChevroletIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M62.329 25.262L44.3245 25.2646C43.8663 25.2646 43.5667 25.1289 43.5667 24.4966V21.824C43.5667 21.0534 43.152 20.6464 42.3994 20.6464H21.7863C21.0157 20.6464 20.6189 21.0816 20.6189 21.8163V24.4889C20.6189 25.0521 20.3527 25.2569 19.8586 25.2569L8.05955 25.2595C7.15587 25.2595 6.62851 25.6896 6.35715 26.2553L0.609947 37.4835C0.535707 37.6268 0.492188 37.7932 0.492188 37.9622C0.492188 38.4051 0.781467 38.9811 1.58787 38.9811L19.856 38.9785C20.4192 38.9785 20.6163 39.2345 20.6163 39.7465V42.4166C20.6163 43.223 21.0823 43.5865 21.7863 43.5865H42.3968C43.0983 43.5865 43.5667 43.246 43.5667 42.4243L43.5642 39.7542C43.5642 39.2089 43.7946 38.9862 44.3219 38.9862L55.7805 38.9836C56.569 38.9836 57.1373 38.7763 57.5341 38.0416L63.2147 26.944C63.3402 26.7033 63.4221 26.5676 63.4221 26.2835C63.4221 25.5257 62.7719 25.262 62.329 25.262ZM57.7901 29.7344L55.0509 35.0924C54.8794 35.4048 54.5747 35.415 54.3597 35.415H40.7712C40.208 35.415 40.0032 35.6684 40.0032 36.1804V39.2627C40.0032 39.7721 39.7779 40.0204 39.2301 40.0204H24.953C24.4743 40.0204 24.1824 39.8515 24.1824 39.255V36.1753C24.1824 35.6121 23.9239 35.4124 23.4119 35.4124H6.74883C6.33923 35.4124 6.05763 35.1564 6.05763 34.798C6.05763 34.6931 6.08323 34.5984 6.12931 34.5088L8.86851 29.1532C8.97347 28.9664 9.14499 28.8307 9.55715 28.8307L23.4119 28.8332C23.8906 28.8332 24.1875 28.6412 24.1875 28.0601V24.9779C24.1875 24.4326 24.4256 24.215 24.953 24.215L39.2276 24.2124C39.7395 24.2124 39.9955 24.4403 39.9955 24.9856V28.0652C39.9955 28.5952 40.2413 28.8281 40.7712 28.8281H57.168C57.6903 28.8281 57.8618 29.1712 57.8618 29.4451C57.8618 29.5449 57.8362 29.6448 57.7901 29.7344Z'
      fill='#595959'
    />
  </svg>
);

export const DodgeIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_691_4275)'>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M54.4238 2.52709C50.7999 2.16939 41.2345 1.63416 32.2132 1.63416C23.1905 1.63416 13.626 2.16895 10.0038 2.52709C5.86794 2.94879 3.94531 5.04939 3.94531 9.14363C3.94531 16.9157 4.23156 29.0266 4.76241 36.1402C5.23715 42.4815 5.60712 47.4884 13.5028 52.2849C19.1515 55.7185 24.769 58.6612 32.0834 62.435L32.2092 62.506L32.3385 62.435C39.67 58.6485 45.2981 55.7058 50.9239 52.2849C58.8236 47.484 59.1957 42.4815 59.6639 36.1402C60.1991 28.9928 60.4876 16.8946 60.4876 9.14363C60.4867 5.04983 58.5592 2.94879 54.4238 2.52709ZM57.2139 35.9671C56.7628 42.0357 56.4635 46.0493 49.651 50.1869C44.3043 53.436 39.5876 55.9132 32.4573 59.616L32.2127 59.7334L31.9703 59.616C25.0653 56.0363 20.1395 53.4448 14.7771 50.1869C7.96153 46.0493 7.65863 42.0317 7.2115 35.9605C6.68241 28.8841 6.39879 16.8631 6.39879 9.1432C6.39879 6.3158 7.36844 5.26681 10.2484 4.97136C13.8298 4.61848 23.293 4.08764 32.2132 4.08764C41.1363 4.08764 50.5934 4.61848 54.1796 4.97136C57.0592 5.26637 58.0271 6.3158 58.0271 9.1432C58.0271 16.8591 57.7426 28.8762 57.2139 35.9671Z'
        fill='#595959'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M31.8345 19.814L30.9841 22.6713C27.9033 16.3747 24.226 13.0704 19.774 13.0704C14.9631 13.0704 12.6082 16.2914 11.9121 17.3088C13.1487 14.2053 16.4114 11.4761 20.7559 11.4761C26.7101 11.4761 30.075 16.1779 31.8345 19.814Z'
        fill='#595959'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M9.52158 26.2681C9.55884 36.7571 12.6102 41.8025 17.1661 41.8025C19.2768 41.8025 20.79 40.4734 20.79 38.3123C20.79 36.4686 19.9895 35.0063 19.6638 34.4189C19.787 35.0229 19.9001 35.7085 19.9001 36.4813C19.9001 38.2895 18.6793 38.8726 17.6803 38.8726C14.6499 38.8726 11.62 32.9793 10.763 26.2685C10.3808 26.2681 9.51106 26.2681 9.52158 26.2681Z'
        fill='#595959'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M43.6745 11.4761C48.0208 11.4761 51.2773 14.2053 52.5209 17.3088C51.8248 16.2914 49.4695 13.0704 44.6529 13.0704C40.2097 13.0704 36.5315 16.3747 33.4485 22.6713L32.5977 19.814C34.3537 16.1779 37.7242 11.4761 43.6745 11.4761Z'
        fill='#595959'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M53.668 26.2681C52.8141 32.9789 49.7816 38.8722 46.7464 38.8722C45.7504 38.8722 44.5336 38.2892 44.5336 36.481C44.5336 35.7081 44.6418 35.0226 44.7637 34.4185C44.4415 35.0059 43.6406 36.4683 43.6406 38.312C43.6406 40.4731 45.1516 41.8022 47.2645 41.8022C51.8168 41.8022 54.8739 36.7571 54.9073 26.2677C54.9208 26.2681 54.0533 26.2681 53.668 26.2681Z'
        fill='#595959'
      />
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M47.4824 17.2462C43.5907 17.2462 39.7871 20.3498 37.5115 27.5112L38.9822 28.5374L38.2782 32.0591L35.5262 33.1976L35.0265 36.6584L36.3683 35.0141L37.8061 34.4184L37.3586 36.6544L34.8783 37.6846L34.0086 43.6686L34.6149 45.5785L32.218 46.5293L29.8188 45.5785L30.4264 43.6686L29.5549 37.6846L27.0721 36.6544L26.6298 34.4184L28.065 35.0141L29.4107 36.6584L28.9049 33.1976L26.1564 32.0591L25.448 28.5374L26.9213 27.5112C24.6475 20.3498 20.8461 17.2462 16.9505 17.2462C12.1377 17.2462 10.1437 21.8148 10.4032 25.5785H11.5631C12.5261 30.901 15.233 35.4108 17.2687 35.4108C17.8912 35.4108 18.2173 34.9365 18.2173 34.1576C18.2173 32.281 16.9364 30.3162 16.9364 26.7274C16.9364 25.0744 17.4756 24.0381 18.717 24.0381C19.5635 24.0381 20.2557 24.9284 20.6673 25.8998C19.9151 28.5808 20.0277 30.8256 22.1678 31.7812C23.2251 32.2511 24.4998 32.8114 24.4998 32.8114C24.4998 32.8114 25.8583 38.5665 25.9565 38.9782C26.0459 39.3543 26.2795 39.8685 26.4518 40.1858C26.6999 40.6185 28.4832 43.6721 28.4832 43.6721C28.4832 43.6721 29.0894 46.7173 29.2183 47.3648C29.5677 49.1077 30.8113 49.1116 32.2175 49.1077C33.6198 49.1121 34.863 49.1077 35.2146 47.3648C35.3439 46.7173 35.9523 43.6721 35.9523 43.6721C35.9523 43.6721 37.7307 40.6185 37.9854 40.1858C38.1551 39.8685 38.3869 39.3547 38.4724 38.9782C38.5706 38.5665 39.9313 32.8114 39.9313 32.8114C39.9313 32.8114 41.2078 32.2511 42.2677 31.7812C44.406 30.8256 44.5209 28.5808 43.766 25.8998C44.1776 24.9284 44.872 24.0381 45.718 24.0381C46.9594 24.0381 47.4964 25.0744 47.4964 26.7274C47.4964 30.3162 46.2155 32.2805 46.2155 34.1576C46.2155 34.9365 46.5417 35.4108 47.1642 35.4108C49.1955 35.4108 51.9063 30.901 52.8733 25.5785H54.0292C54.2888 21.8148 52.2973 17.2462 47.4824 17.2462ZM23.005 30.7445C21.4901 30.1006 21.3358 28.3073 21.8412 25.9213L23.5004 28.5291L24.1171 31.2193C24.1171 31.2193 23.5175 30.9619 23.005 30.7445ZM41.4296 30.7445C40.9136 30.9619 40.3135 31.2193 40.3135 31.2193L40.9281 28.5291L42.589 25.9213C43.0958 28.3077 42.9423 30.1006 41.4296 30.7445Z'
        fill='#595959'
      />
    </g>
    <defs>
      <clipPath id='clip0_691_4275'>
        <rect width='64' height='64' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const FordIcon: React.FC<IconSvgProps> = ({ size = 64, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_691_4230)'>
      <g clipPath='url(#clip1_691_4230)'>
        <path
          d='M31.9424 20.2412C49.089 20.2413 62.9912 25.5099 62.9912 32C62.9907 38.4899 49.0888 43.7382 31.9424 43.7383C14.7759 43.7383 0.873524 38.4903 0.873047 32C0.873047 25.5099 14.7756 20.2412 31.9424 20.2412ZM31.9424 21.4229C15.4766 21.4229 2.0957 26.171 2.0957 32C2.09622 37.8491 15.4769 42.5361 31.9424 42.5361C48.4481 42.5361 61.8091 37.8491 61.8096 32C61.8096 26.171 48.4484 21.4229 31.9424 21.4229ZM31.9424 22.3047C47.9075 22.3047 60.8682 26.6517 60.8682 32C60.8677 37.3687 47.9072 41.7158 31.9424 41.7158C15.9577 41.7158 3.03789 37.3687 3.03711 32C3.03711 26.6518 15.9574 22.3047 31.9424 22.3047ZM25.1123 24.207C20.1251 24.2071 18.1012 26.2103 18.0811 28.1934C18.0611 29.255 18.8425 30.3365 20.0039 30.3369C22.0865 30.3364 23.2893 28.1738 23.3896 27.3926C23.3912 27.3871 23.4267 27.2505 23.3096 27.1523C23.2494 27.1123 23.0894 27.1327 23.0293 27.2725C22.7487 27.9333 21.6266 28.6946 20.8252 28.835C20.0842 28.9751 19.5834 28.5746 19.543 27.9541C19.4626 26.4318 21.186 24.7687 25.0518 24.7686C26.1536 24.7687 27.5565 25.0692 29.0986 25.4297C29.1113 25.4326 29.1248 25.4364 29.1377 25.4395C28.517 25.5778 26.3287 27.265 24.6123 29.8965C24.1519 29.9566 22.2293 30.1173 21.5879 30.8379C21.5276 30.9181 21.467 31.0581 21.4668 31.0986C21.507 31.2589 21.6277 31.3393 21.8076 31.1992C22.2089 30.7391 23.83 30.5581 24.2109 30.5381C21.8476 33.8629 19.6635 36.0464 17.7207 36.0469C17.5208 36.0469 17.3197 36.067 17.0996 36.0068C16.3188 35.8268 15.8584 35.0047 15.8584 34.2637C15.8587 33.2823 16.799 32.2215 17.3398 32.0205C17.5201 31.9405 17.6006 31.84 17.6006 31.7598C17.6005 31.6399 17.5204 31.5598 17.3008 31.5596C15.4378 32.0204 14.4358 33.5434 14.4561 34.7852C14.4965 36.8281 16.0386 37.9697 17.7812 37.9697C20.2248 37.9695 21.4673 36.9074 25.4531 30.458C27.0354 30.2977 27.8174 30.1967 28.6182 30.0566C28.6238 30.07 28.8661 30.6377 29.46 30.6377C29.5588 30.6568 29.5398 30.5571 29.5996 30.3379C29.3392 30.3176 29.0395 30.1372 29.0391 29.917C29.2789 29.7969 29.4797 29.6553 29.6602 29.5156C29.9205 29.2751 30.1806 28.775 30.1807 28.4346C30.1807 28.1144 29.9406 27.8133 29.5801 27.7529C28.939 27.6527 28.4381 28.174 28.3779 29.0352C28.3779 29.2501 28.4542 29.503 28.458 29.5156C28.4452 29.5178 27.0507 29.7565 25.8545 29.8164C27.3365 27.3131 28.6989 26.4309 29.0996 26.0703C29.1798 26.0094 29.3792 25.79 29.3994 25.75C29.4454 25.635 29.4043 25.5467 29.3467 25.4922C30.8577 25.9021 33.7677 27.1727 36.5693 27.1729C38.4722 27.1726 40.7164 25.9507 40.7168 25.3096C40.7168 25.1493 40.7161 24.9885 40.3164 24.9883C39.8759 24.9883 40.1144 25.0288 39.0137 25.209C37.9725 25.3692 36.6902 25.3291 35.6885 25.3291C32.9647 25.2889 29.6195 24.7287 28.2773 24.4883C27.1157 24.2878 26.0533 24.2071 25.1123 24.207ZM47.8672 28.334L45.2832 32.7012C45.083 32.3005 44.7824 31.3592 43.6016 31.3389C41.6383 31.3191 40.8763 32.6606 39.5146 33.9424C39.114 34.3029 38.6326 34.7843 37.5312 34.7842C36.8907 34.784 36.3896 34.2633 36.5098 33.6025C36.5901 33.0822 36.7703 32.8211 37.1504 32.6807C37.3307 33.201 37.6715 33.4813 38.2529 33.4814C38.913 33.4611 39.293 32.8612 39.3135 32.3408C39.3135 31.9004 39.0332 31.3394 38.2324 31.2988C37.4915 31.2591 36.9295 31.5995 36.1289 32.5205C36.1317 32.5009 36.3176 31.1589 34.8271 31.1982C34.6675 31.1982 34.5064 31.1987 34.3467 31.2783C33.525 31.5388 32.4633 32.8613 31.6221 33.8828C31.6622 33.6823 31.6621 33.4818 31.6621 33.2812C31.6621 32.7007 31.4415 31.9389 31.041 31.5381C30.9614 31.4587 30.8804 31.459 30.8008 31.459C30.5406 31.4591 30.3203 31.6793 30.3203 32.0195C30.5204 32.2205 30.7812 32.7209 30.7812 33.2012C30.7812 33.6818 30.6409 34.5634 30.4404 34.9043C29.6793 36.2058 28.7171 37.047 27.5557 36.8672C26.9349 36.7267 26.5136 36.1259 26.6338 35.2246C26.6939 34.704 27.0153 33.9826 27.3154 33.542C27.8164 32.861 28.6376 32.1599 29.8389 31.9795C29.8413 31.9692 29.895 31.7368 29.7393 31.6191C29.6792 31.519 29.5982 31.3987 29.3184 31.3984C27.616 31.4586 26.5739 32.681 25.9727 33.8828C25.7526 34.3034 25.4319 34.9048 25.252 35.2852C25.2463 35.3003 25.0783 35.7363 24.3506 36.2871C23.9719 36.5861 23.8504 36.6861 23.79 36.667C23.8103 36.8074 23.9103 37.008 24.0908 37.168C24.1511 37.2068 24.3507 37.0877 24.4307 37.0479C25.3621 36.5127 25.4706 36.2523 25.4727 36.2471C25.6729 37.3688 26.6346 37.9491 27.6963 37.9492C29.158 37.9486 30.4998 36.6276 31.2812 35.4658C32.0979 34.2511 33.2118 33.0557 33.2246 33.042C33.6656 32.6219 34.1261 32.341 34.4062 32.3408C34.6665 32.3607 34.8474 32.5818 34.7871 32.8223C34.6875 33.2423 34.5472 33.6429 34.2666 34.1436L32.083 37.8496H33.7852C34.7661 36.0069 34.8072 35.9464 35.7686 34.1836C36.0285 35.1651 36.5501 35.5461 37.3916 35.5664C38.1121 35.5863 38.6138 35.546 39.1543 35.2656C39.0142 35.8263 39.0942 36.3871 39.2744 36.7676C39.4743 37.228 39.8753 37.8089 40.8564 37.8291C42.0377 37.8289 43.2006 37.3079 43.541 37.0078C43.641 37.5884 43.9222 37.8896 44.6631 37.8896C46.1651 37.8489 47.4877 36.3062 48.2891 35.3047C48.4291 35.1243 48.6094 34.8244 48.6094 34.7441C48.6093 34.6243 48.4487 34.5444 48.3682 34.5439C48.2886 34.5444 48.148 34.7236 48.0684 34.8242C47.6875 35.2247 46.1055 36.867 45.2441 36.9082C45.4219 36.9085 44.9441 37.0067 44.9033 36.627C44.8832 36.3866 45.0827 36.0858 45.1631 35.9258L49.4502 28.334H47.8672ZM43.6816 32.2803C44.5412 32.3806 44.6225 33.2223 44.2021 34.0029L44.4229 34.0635C44.4131 34.0798 43.7367 35.21 43.041 35.9062C41.801 37.1661 40.9991 36.7481 40.8174 36.6074C40.6372 36.4672 40.4967 35.9665 40.5762 35.4658C40.6366 34.9652 41.0174 34.1232 41.3779 33.6826C42.0986 32.8015 42.9802 32.2005 43.6816 32.2803ZM29.499 28.1934C29.6388 28.1737 29.6994 28.3136 29.7197 28.4336C29.7598 28.6738 29.5597 29.0348 29.4395 29.1553C29.1471 29.4871 28.9486 29.4764 28.9385 29.4756C28.8787 29.2355 28.8385 29.0147 28.9385 28.6943C29.0185 28.3943 29.1986 28.2538 29.499 28.1934Z'
          fill='#595959'
        />
      </g>
    </g>
    <defs>
      <clipPath id='clip0_691_4230'>
        <rect width='64' height='64' fill='white' />
      </clipPath>
      <clipPath id='clip1_691_4230'>
        <rect width='64' height='64' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const HondaIcon: React.FC<IconSvgProps> = ({ size = 64, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g clipPath='url(#clip0_2198_6204)'>
      <path
        d='M46.7785 10.3318C45.3435 16.9327 44.7695 19.9461 43.4781 24.6816C42.1866 29.417 41.4691 33.4349 39.8906 35.5874C38.7426 37.1659 36.8772 38.1704 34.8682 38.3138C33.0027 38.4573 30.9937 38.4573 29.1283 38.3138C27.1193 38.1704 25.2538 37.1659 24.1059 35.5874C22.5274 33.5784 21.6664 29.2735 20.5184 24.6816C19.3704 20.0896 18.6529 16.9327 17.218 10.3318L15.0655 10.4753C14.2045 10.4753 13.487 10.6188 12.7695 10.7623C12.7695 10.7623 13.6305 24.2511 14.061 29.991C14.4915 36.0179 15.209 46.0627 15.783 53.8116C15.783 53.8116 17.0745 53.9551 19.0834 54.0986C21.0924 54.2421 22.2404 54.2421 22.2404 54.2421C23.1014 50.7982 24.2494 46.2062 25.3973 44.1973C26.1148 43.0493 27.4063 42.3318 28.8413 42.3318C29.8458 42.1883 30.8502 42.1883 31.9982 42.1883C33.0027 42.1883 34.0072 42.1883 35.1552 42.3318C36.5902 42.3318 37.8816 43.0493 38.5991 44.1973C39.8906 46.2062 40.8951 50.7982 41.7561 54.2421C41.7561 54.2421 42.7606 54.2421 44.913 54.0986C47.0655 53.9551 48.2135 53.8116 48.2135 53.8116C48.931 46.2062 49.6485 36.0179 49.9355 29.991C50.3659 24.2511 51.2269 10.7623 51.2269 10.7623C50.5094 10.6188 49.792 10.6188 48.931 10.4753L46.7785 10.3318Z'
        fill='#595959'
      />
      <path
        d='M63.712 18.3677C62.851 9.7578 57.1111 8.03582 52.0887 7.17484C48.7882 6.74434 45.4878 6.45735 42.1873 6.31385C39.6044 6.17035 33.7209 6.02686 31.999 6.02686C30.277 6.02686 24.2501 6.17035 21.8106 6.31385C18.3667 6.31385 15.0662 6.60085 11.7658 7.17484C6.74336 8.03582 1.00345 9.9013 0.142464 18.3677C-0.144531 21.2376 -0.144531 24.1076 -0.144531 26.9775C-0.144531 30.852 0.142464 34.7264 0.716455 38.6008C1.00345 41.9013 1.72094 45.0582 2.58193 48.3587C3.87341 52.0896 5.02139 53.2376 6.31287 54.2421C8.60883 55.8206 11.0483 56.6816 13.7748 57.1121C25.8286 58.4035 37.8824 58.4035 49.9362 57.1121C52.6626 56.6816 55.1021 55.8206 57.3981 54.2421C58.833 53.0941 59.981 52.0896 61.129 48.3587C61.99 45.2017 62.7075 41.9013 62.9945 38.6008C63.425 34.7264 63.712 30.852 63.8555 26.9775C63.999 24.1076 63.8555 21.2376 63.712 18.3677ZM60.555 32.7174C60.4115 37.4529 59.694 42.0448 58.5461 46.6367C58.1156 48.7892 56.9676 50.6547 55.3891 52.2331C53.2366 53.9551 50.6537 54.9596 48.0707 55.1031C37.3084 56.2511 26.5461 56.2511 15.7837 55.1031C13.0573 54.9596 10.6178 53.9551 8.46533 52.2331C6.88686 50.6547 5.88237 48.7892 5.30838 46.6367C4.1604 42.0448 3.58641 37.4529 3.29941 32.7174C3.01242 27.982 3.01242 23.1031 3.44291 18.3677C4.3039 12.9147 6.88686 10.3318 12.6268 9.3273C15.7837 8.75331 19.0842 8.46632 22.2411 8.32282C24.9676 8.17932 29.416 8.03582 31.999 8.03582C34.5819 8.03582 39.0304 8.03582 41.7568 8.32282C44.9138 8.46632 48.2142 8.75331 51.3712 9.3273C57.1111 10.3318 59.694 13.0582 60.4115 18.3677C60.6985 23.1031 60.842 27.982 60.555 32.7174Z'
        fill='#595959'
      />
    </g>
    <defs>
      <clipPath id='clip0_2198_6204'>
        <rect width='64' height='64' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const NissanIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M37.2937 34.1481C37.2429 34.1609 37.0398 34.1609 36.9509 34.1609H30.3985V35.6907H37.0652C37.1159 35.6907 37.5096 35.6907 37.5858 35.678C38.9445 35.5505 39.5667 34.4159 39.5667 33.4215C39.5667 32.4016 38.9191 31.3053 37.6874 31.1905C37.4461 31.165 37.2429 31.165 37.154 31.165H32.7985C32.608 31.165 32.3921 31.1523 32.3159 31.1268C31.9731 31.0375 31.8461 30.7316 31.8461 30.4766C31.8461 30.2471 31.9731 29.9412 32.3286 29.8392C32.4302 29.8137 32.5445 29.8009 32.7858 29.8009H39.0715V28.2966H32.6842C32.4175 28.2966 32.2144 28.3094 32.0493 28.3349C30.9572 28.4879 30.1953 29.3675 30.1953 30.4894C30.1953 31.4072 30.7667 32.4781 32.0239 32.6566C32.2525 32.6821 32.5699 32.6821 32.7096 32.6821H36.9509C37.0271 32.6821 37.2175 32.6821 37.2556 32.6948C37.7382 32.7586 37.9032 33.1155 37.9032 33.4342C37.9032 33.7402 37.7128 34.0717 37.2937 34.1481Z'
      fill='#595959'
    />
    <path
      d='M24.8758 34.1481C24.825 34.1609 24.6218 34.1609 24.5456 34.1609H17.9805V35.6907H24.6472C24.698 35.6907 25.0916 35.6907 25.1678 35.678C26.5265 35.5505 27.1488 34.4159 27.1488 33.4215C27.1488 32.4016 26.5012 31.3053 25.2694 31.1905C25.0281 31.165 24.825 31.165 24.7361 31.165H20.3805C20.19 31.165 19.9742 31.1523 19.898 31.1268C19.5551 31.0375 19.4281 30.7316 19.4281 30.4766C19.4281 30.2471 19.5551 29.9412 19.9107 29.8392C20.0123 29.8137 20.1265 29.8009 20.3678 29.8009H26.6535V28.2966H20.2662C19.9996 28.2966 19.7964 28.3094 19.6313 28.3349C18.5392 28.4879 17.7773 29.3675 17.7773 30.4894C17.7773 31.4072 18.3488 32.4781 19.6059 32.6566C19.8345 32.6821 20.1519 32.6821 20.2916 32.6821H24.5329C24.6091 32.6821 24.7996 32.6821 24.8377 32.6948C25.3202 32.7586 25.4853 33.1155 25.4853 33.4342C25.4853 33.7402 25.3075 34.0717 24.8758 34.1481Z'
      fill='#595959'
    />
    <path
      d='M14.5649 28.2456H12.9141V35.7289H14.5649V28.2456Z'
      fill='#595959'
    />
    <path
      d='M9.26984 35.7289V28.2456H7.61905V33.8294L2.12063 28.2456H0V35.7289H1.65079V30.1196L7.1873 35.7289H9.26984Z'
      fill='#595959'
    />
    <path
      d='M62.3612 28.2456V33.8294L56.8628 28.2456H54.7422V35.7289H56.393V30.1196L61.9168 35.7289H63.9993V28.2456H62.3612Z'
      fill='#595959'
    />
    <path
      d='M46.1457 28.2456L41.498 35.7289H43.5044L44.3298 34.3903H49.752L50.5774 35.7289H52.5711L47.9234 28.2456H46.1457ZM48.9012 32.9753H45.1806L47.0473 29.9666L48.9012 32.9753Z'
      fill='#595959'
    />
    <path
      d='M9.18049 24.0004C12.5075 14.2478 21.6757 7.69517 32.0122 7.69517C42.3487 7.69517 51.5297 14.2478 54.844 24.0004L54.8694 24.0769H62.1456V23.1972L59.1233 22.8403C57.2567 22.6235 56.863 21.7949 56.3551 20.7495L56.2281 20.4946C51.8599 11.1627 42.3487 5.12 32.0122 5.12C21.663 5.12 12.1646 11.1627 7.79637 20.5201L7.66938 20.775C7.16145 21.8204 6.76779 22.649 4.90113 22.8658L1.87891 23.2227V24.1024H9.1424L9.18049 24.0004Z'
      fill='#595959'
    />
    <path
      d='M54.8704 39.9103L54.845 39.9868C51.518 49.7393 42.3497 56.2793 32.0132 56.2793C21.6767 56.2793 12.4958 49.7266 9.18147 39.9741L9.15607 39.8976H1.89258V40.7772L4.9148 41.1342C6.78147 41.3509 7.17512 42.1795 7.68305 43.2249L7.81004 43.4799C12.1783 52.8372 21.6894 58.88 32.0259 58.88C42.3624 58.88 51.8735 52.8372 56.2418 43.4926L56.3688 43.2377C56.8767 42.1923 57.2704 41.3637 59.137 41.1469L62.1592 40.79V39.9103H54.8704Z'
      fill='#595959'
    />
  </svg>
);

export const ToyotaIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 64 64'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M31.919 11.6321C14.4709 11.6321 0.234375 20.7416 0.234375 31.9182C0.234375 43.0949 14.4709 52.2043 31.919 52.2043C49.3672 52.2043 63.6037 43.0949 63.6037 31.9182C63.6037 20.7416 49.3672 11.6321 31.919 11.6321ZM40.6898 15.3927C43.4928 15.9299 46.1205 16.7241 48.4796 17.7284C50.5117 18.7795 51.703 20.0175 51.703 21.3605C51.703 24.07 46.8446 26.4175 39.9074 27.4452C39.4285 22.2131 38.1439 17.7401 36.4154 14.8788C37.9103 14.9956 39.3351 15.1708 40.6898 15.3927ZM31.919 14.7036C34.5468 14.7036 36.7541 20.2744 37.3731 27.7605C35.6329 27.9241 33.811 28.0175 31.919 28.0175C30.0271 28.0175 28.1935 27.9241 26.465 27.7605C27.084 20.2627 29.303 14.7036 31.919 14.7036ZM15.3585 17.7284C17.7176 16.7241 20.3453 15.9416 23.1482 15.3927C24.4913 15.1708 25.9278 14.9956 27.4227 14.8788C25.6942 17.7401 24.4096 22.2248 23.9307 27.4452C16.9935 26.4058 12.1351 24.07 12.1351 21.3605C12.1351 20.0175 13.3263 18.7678 15.3585 17.7284ZM3.04897 31.9182C3.04897 27.8423 5.4081 24.0934 9.34386 21.127C9.33218 21.2671 9.32051 21.4073 9.32051 21.5474C9.32051 25.5299 15.3234 28.9518 23.7555 30.3182C23.7322 30.8905 23.7322 31.4627 23.7322 32.0467C23.7322 39.1007 25.157 45.3372 27.3293 49.0394C13.595 47.7197 3.04897 40.5372 3.04897 31.9182ZM32.6198 49.2613C32.3862 49.2613 32.1526 49.2613 31.919 49.2613C31.6855 49.2613 31.4519 49.2613 31.2183 49.2613C28.4388 48.1985 26.2782 40.8759 26.2782 32.0467C26.2782 31.5795 26.2898 31.1241 26.3015 30.6686C28.1001 30.8554 29.9804 30.9605 31.919 30.9605C33.8577 30.9605 35.738 30.8554 37.5366 30.6686C37.5482 31.1241 37.5599 31.5912 37.5599 32.0467C37.5482 40.8759 35.3877 48.1985 32.6198 49.2613ZM36.5088 49.0511C38.6811 45.3489 40.1059 39.1124 40.1059 32.0584C40.1059 31.4744 40.0942 30.9022 40.0826 30.3299C48.5147 28.9635 54.5176 25.5416 54.5176 21.5591C54.5176 21.4189 54.5059 21.2788 54.4942 21.1386C58.43 24.1051 60.7891 27.854 60.7891 31.9299C60.7891 40.5372 50.2431 47.7197 36.5088 49.0511Z'
      fill='#595959'
    />
  </svg>
);

export const SedanIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M4.18993 12.6481C3.18984 12.6481 2.37891 13.4588 2.37891 14.4591C2.37891 14.5362 2.38521 14.6121 2.39491 14.6866C2.50719 15.5792 3.26696 16.2696 4.18969 16.2696C5.1374 16.2696 5.91439 15.5412 5.9932 14.6133C5.99732 14.5626 6.00072 14.511 6.00072 14.4589C6.00096 13.4588 5.19027 12.6481 4.18993 12.6481ZM3.28345 13.7767L3.65254 14.146C3.62393 14.1953 3.60137 14.2484 3.58682 14.3051H3.06641C3.09308 14.1082 3.1685 13.9283 3.28345 13.7767ZM3.06398 14.6187H3.58852C3.60331 14.6744 3.62514 14.7273 3.65424 14.7758L3.28418 15.1456C3.16947 14.9953 3.09236 14.8153 3.06398 14.6187ZM4.03328 15.5841C3.83709 15.5567 3.65885 15.4798 3.50801 15.3661L3.87613 14.9977C3.92463 15.0261 3.97774 15.0469 4.03328 15.0615V15.5841ZM4.03328 13.8567C3.97629 13.8718 3.92294 13.8941 3.87322 13.9234L3.50437 13.5546C3.65594 13.4394 3.83588 13.3632 4.03328 13.3358V13.8567ZM4.34684 13.3353C4.54423 13.3627 4.72442 13.4394 4.87574 13.5543L4.50713 13.9232C4.45766 13.8938 4.40382 13.8715 4.34708 13.8565L4.34684 13.3353ZM4.34684 15.5836V15.0617C4.40261 15.0469 4.45523 15.0263 4.50374 14.9977L4.8721 15.3661C4.72126 15.4798 4.54278 15.5562 4.34684 15.5836ZM5.09666 15.1473L4.72539 14.7756C4.75449 14.7268 4.77801 14.6747 4.7928 14.6189H5.31322C5.28557 14.8149 5.21161 14.9962 5.09666 15.1473ZM4.79353 14.3051C4.77874 14.2484 4.75643 14.1953 4.72781 14.146L5.09739 13.7767C5.21161 13.9283 5.28703 14.1082 5.31419 14.3054H4.79353V14.3051Z'
      fill='black'
    />
    <path
      d='M19.227 12.6481C18.227 12.6481 17.416 13.4588 17.416 14.4591C17.416 14.5362 17.4223 14.6121 17.432 14.6866C17.5443 15.5792 18.3041 16.2696 19.2266 16.2696C20.1743 16.2696 20.9513 15.5412 21.0303 14.6133C21.0344 14.5626 21.0378 14.511 21.0378 14.4589C21.0383 13.4588 20.2274 12.6481 19.227 12.6481ZM18.3206 13.7767L18.6894 14.146C18.6608 14.1953 18.6382 14.2484 18.6237 14.3051H18.1033C18.1302 14.1082 18.2056 13.9283 18.3206 13.7767ZM18.1013 14.6187H18.6259C18.6407 14.6744 18.6625 14.7273 18.6916 14.7758L18.3218 15.1456C18.2066 14.9953 18.1292 14.8153 18.1013 14.6187ZM19.0704 15.5841C18.8742 15.5567 18.696 15.4798 18.5451 15.3661L18.9132 14.9977C18.9617 15.0261 19.0149 15.0469 19.0704 15.0615V15.5841ZM19.0704 13.8567C19.0134 13.8718 18.96 13.8941 18.9103 13.9234L18.5415 13.5546C18.693 13.4394 18.8727 13.3632 19.0704 13.3358V13.8567ZM19.3842 13.3353C19.5816 13.3627 19.7618 13.4394 19.9131 13.5543L19.5442 13.9232C19.4948 13.8938 19.4409 13.871 19.3842 13.8565V13.3353ZM19.3842 15.5836V15.0617C19.44 15.0469 19.4926 15.0263 19.5411 14.9977L19.9095 15.3661C19.7586 15.4798 19.5799 15.5562 19.3842 15.5836ZM20.1338 15.1473L19.7625 14.7761C19.7916 14.7271 19.8154 14.6752 19.8299 14.6192H20.3503C20.3227 14.8149 20.249 14.9962 20.1338 15.1473ZM19.8306 14.3051C19.8158 14.2484 19.7938 14.1953 19.7649 14.146L20.1343 13.7767C20.2487 13.9283 20.3239 14.1082 20.3513 14.3054H19.8306V14.3051Z'
      fill='black'
    />
    <path
      d='M23.5755 11.7105V10.3705C23.5755 10.1549 23.4189 9.97227 23.2059 9.93905C22.695 9.85902 21.7892 9.70794 21.3823 9.58256C20.7988 9.40262 18.5445 8.44812 17.7639 8.26891C16.983 8.0897 13.4623 7.13278 10.0903 8.30165C9.51968 8.49929 6.95276 9.72637 5.44341 10.3644C4.9989 10.3741 0.599128 11.2913 0.364869 11.9198C0.130609 12.5486 0.0571297 12.8537 0.0139638 13.0133C-0.0292021 13.1729 0.0139638 13.9365 0.340861 14.4683C0.674063 14.6567 1.31549 14.7833 2.05707 14.8682C2.04858 14.8229 2.03937 14.7782 2.03355 14.7324C2.02069 14.6344 2.01463 14.5449 2.01463 14.4596C2.01463 13.2604 2.98999 12.2846 4.18942 12.2846C5.38885 12.2846 6.3642 13.2602 6.3642 14.4596C6.3642 14.5212 6.36008 14.5823 6.35547 14.6424C6.34407 14.777 6.31982 14.9077 6.28466 15.0336C6.28636 15.0336 6.29048 15.0336 6.29048 15.0336L17.0858 14.8163C17.081 14.7884 17.0747 14.7608 17.071 14.7324C17.0582 14.6349 17.0521 14.5452 17.0521 14.4596C17.0521 13.2604 18.0275 12.2848 19.2269 12.2848C20.4263 12.2848 21.4019 13.2602 21.4019 14.4596C21.4019 14.4642 21.4015 14.4681 21.4012 14.4724L21.4473 14.4686L23.293 14.121C23.293 14.121 23.9999 13.7447 23.9999 12.7092C24.0001 12.0185 23.5755 11.7105 23.5755 11.7105ZM12.8667 10.4401L8.83508 10.5635C8.90929 9.95942 8.5516 9.82386 8.5516 9.82386C10.1543 8.36907 13.3845 8.31984 13.3845 8.31984L12.8667 10.4401ZM17.3914 10.2555L13.7174 10.379L14.0504 8.32008C15.9492 8.29535 17.0339 8.7144 17.0339 8.7144L17.5764 9.58984L17.3914 10.2555ZM19.4626 10.2429H18.439L17.4156 8.83759C18.1834 9.14314 18.7979 9.44434 19.1639 9.6347C19.386 9.75013 19.5072 9.99676 19.4626 10.2429Z'
      fill='black'
    />
  </svg>
);

export const SUVIcon: React.FC<IconSvgProps> = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_871_2829)'>
      <path
        fillRule='evenodd'
        clipRule='evenodd'
        d='M12.7386 6.03125H17.9222H19.2171C19.2913 6.03125 19.3187 6.09766 19.3499 6.16406L19.8695 7.24414C19.9007 7.31055 19.8089 7.37695 19.7366 7.37695H10.9241C10.348 7.37891 11.3323 6.03125 12.7386 6.03125ZM4.65461 14.9648V15.6953H5.38508C5.29719 15.3379 5.01398 15.0527 4.65461 14.9648ZM5.38508 16.1738H4.65461V16.9043C5.01398 16.8164 5.29719 16.5332 5.38508 16.1738ZM4.17805 16.9043V16.1738H3.44758C3.53547 16.5332 3.81867 16.8164 4.17805 16.9043ZM3.44563 15.6973H4.17609V14.9668C3.81867 15.0547 3.53547 15.3379 3.44563 15.6973ZM17.5882 14.9648V15.6953H18.3187C18.2308 15.3379 17.9476 15.0527 17.5882 14.9648ZM18.3187 16.1738H17.5882V16.9043C17.9476 16.8164 18.2308 16.5332 18.3187 16.1738ZM17.1116 16.9043V16.1738H16.3812C16.4671 16.5332 16.7503 16.8164 17.1116 16.9043ZM16.3792 15.6973H17.1097V14.9668C16.7503 15.0547 16.4671 15.3379 16.3792 15.6973ZM17.512 8.52539H18.1995C19.1917 8.57031 19.5999 8.53516 19.9945 8.83594C20.4827 9.20898 20.6741 10.8574 20.8773 11.6191C20.8909 11.6699 20.8323 11.7168 20.7796 11.7168H17.7503C17.6976 11.7168 17.6585 11.6738 17.6527 11.6191L17.4144 8.62109C17.4105 8.57031 17.4593 8.52539 17.512 8.52539ZM12.9085 8.54297H10.6624C9.63703 8.54297 7.94953 10.2285 7.50813 11.5918C7.48664 11.6582 7.56477 11.7188 7.63508 11.7188H12.553C12.6234 11.7188 12.6702 11.6621 12.68 11.5918L13.0374 8.66992C13.0433 8.59961 12.9769 8.54297 12.9085 8.54297ZM13.8812 8.53125H16.6292C16.682 8.53125 16.723 8.57617 16.7269 8.62891L16.9359 11.6211C16.9398 11.6738 16.8909 11.7188 16.8382 11.7188H13.5238C13.471 11.7188 13.4202 11.6738 13.4261 11.6211L13.7835 8.62891C13.7894 8.57422 13.8265 8.53125 13.8812 8.53125ZM4.41633 13.9043C5.53742 13.9043 6.44758 14.8145 6.44758 15.9355C6.44758 17.0566 5.53742 17.9668 4.41633 17.9668C3.29523 17.9668 2.38508 17.0566 2.38508 15.9355C2.38508 14.8145 3.29523 13.9043 4.41633 13.9043ZM0.353829 13.9961C0.457344 13.9492 0.570625 13.9277 0.693672 13.9297C0.687813 13.2891 0.730782 12.7305 0.879219 12.334C0.933907 12.1055 1.03352 11.9395 1.16633 11.8184C1.5843 11.4453 5.31672 11.1172 6.10383 11.0156C7.07063 10.0703 8.1468 9.20508 9.29328 8.38672C9.61164 8.11719 10.0667 7.98438 10.6409 7.9707L19.7054 7.96289C20.3909 7.95898 20.9183 8.25195 21.2542 8.91016L22.0101 11.0879L22.182 11.041V10.1934C22.1507 9.91016 22.262 9.76953 22.4788 9.73437H23.4945C23.7738 9.74609 23.971 9.88672 24.0023 10.291V13.3027C24.0042 13.6133 23.8909 13.8164 23.6038 13.8594H22.6605C22.5667 13.8809 22.596 13.9531 22.5882 14.0527V15.0801C22.5198 15.8379 22.3128 16.4238 21.7054 16.5H19.8675C19.9066 15.6094 19.7386 14.8809 19.3304 14.3359C17.848 12.3555 14.6312 13.5352 14.848 16.5059H6.94953C7.01594 15.5566 6.83625 14.8359 6.44367 14.3184C4.96516 12.3672 1.5257 13.4199 1.93195 16.5664H0.711251C-0.0250776 16.5664 -0.265312 14.2715 0.353829 13.9961ZM17.3499 13.9043C18.471 13.9043 19.3812 14.8145 19.3812 15.9355C19.3812 17.0566 18.471 17.9668 17.3499 17.9668C16.2288 17.9668 15.3187 17.0566 15.3187 15.9355C15.3187 14.8145 16.2269 13.9043 17.3499 13.9043Z'
        fill='black'
      />
    </g>
    <defs>
      <clipPath id='clip0_871_2829'>
        <rect width={size} height={size} fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const HatchBackIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      fillRule='evenodd'
      clipRule='evenodd'
      d='M20.3004 12.4336C21.3531 12.4336 22.2066 13.2871 22.2066 14.3398C22.2066 15.3926 21.3531 16.2461 20.3004 16.2461C19.2477 16.2461 18.3941 15.3926 18.3941 14.3398C18.3941 13.2871 19.2477 12.4336 20.3004 12.4336ZM4.4918 13.4297V14.1152H5.17735C5.09532 13.7793 4.82969 13.5117 4.4918 13.4297ZM5.1793 14.5625H4.4918V15.248C4.82969 15.168 5.09532 14.9004 5.1793 14.5625ZM4.04453 15.25V14.5644H3.35899C3.44102 14.9004 3.7086 15.166 4.04453 15.25ZM3.35899 14.1172H4.04453V13.4316C3.7086 13.5117 3.44102 13.7793 3.35899 14.1172ZM20.525 13.4297V14.1152H21.2106C21.1285 13.7793 20.8629 13.5117 20.525 13.4297ZM21.2106 14.5625H20.525V15.248C20.8629 15.168 21.1285 14.9004 21.2106 14.5625ZM20.0777 15.25V14.5644H19.3922C19.4742 14.9004 19.7398 15.166 20.0777 15.25ZM19.3902 14.1172H20.0758V13.4316C19.7398 13.5117 19.4742 13.7793 19.3902 14.1172ZM9.62657 10.25C9.32578 10.1816 9.02696 10.1816 8.72618 10.1953C11.0797 8.95898 12.0035 8.15624 14.7594 8.31835L14.3805 10.832L9.84336 11.0039C9.88438 10.8848 9.90782 10.8203 9.91563 10.7012C9.93711 10.3613 9.93321 10.3203 9.62657 10.25ZM15.4527 8.36327L14.9605 10.7988L19.6734 10.6074C20.1578 10.5879 20.2418 10.375 19.9488 9.96679C19.816 9.78124 19.6676 9.59765 19.4977 9.41601C18.2789 8.11523 17.066 8.38476 15.4527 8.36327ZM0.0894563 13.0801H0.233988C0.323831 12.6816 0.501566 12.3223 0.763285 12C1.3375 11.2851 1.59922 11.375 2.45274 11.2207L7.23008 10.3203C8.29063 9.5664 9.56993 8.89452 11.1305 8.32812C12.5777 7.80077 13.5992 7.74999 15.148 7.75194C16.0348 7.7539 16.9332 7.80663 17.8453 7.91601C18.3082 7.9453 18.7613 8.0078 19.2066 8.09765C19.7398 8.20507 20.2633 8.35351 20.777 8.52929L22.691 9.63476C23.2555 9.96093 23.3766 10.3418 23.4488 10.9648L23.7184 13.2656H23.9977V14.5371C23.9586 14.9648 23.7906 15.0293 23.4352 15.0293H22.9723C23.152 11.0078 17.4938 10.3203 17.6168 15.3476H6.78867C7.51719 11.8809 4.0211 10.6777 2.3043 12.6601C1.78282 13.2637 1.60117 14.0879 1.64805 15.0625H0.396097C0.296488 15.0156 0.218363 14.9512 0.159769 14.8711C-0.0453093 14.5918 -0.000387399 13.75 0.0152376 13.2637C0.0171907 13.1328 -0.0238249 13.0801 0.0894563 13.0801ZM4.26914 12.4336C5.32188 12.4336 6.17539 13.2871 6.17539 14.3398C6.17539 15.3926 5.32188 16.2461 4.26914 16.2461C3.21641 16.2461 2.36289 15.3926 2.36289 14.3398C2.36289 13.2871 3.21641 12.4336 4.26914 12.4336Z'
      fill='black'
    />
  </svg>
);

export const ConvertibleIcon: React.FC<IconSvgProps> = ({
  size = 24,
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_871_4417)'>
      <path
        d='M0.204783 14.7997C0.210267 15.251 0.888847 15.2362 0.919251 15.2354C0.886203 15.0726 0.868627 14.9036 0.868627 14.7306C0.868627 13.3269 2.0109 12.1842 3.41492 12.1842C4.81883 12.1842 5.96121 13.3269 5.96121 14.7306C5.96121 15.0249 5.90843 15.306 5.81634 15.5691C8.64983 15.3829 17.571 15.4494 17.9481 15.4914C17.9958 15.4967 18.0939 15.4956 18.2293 15.4897C18.1885 15.3068 18.1643 15.1176 18.1643 14.9228C18.1643 13.5055 19.3174 12.3524 20.7352 12.3524C22.14 12.3524 23.2844 13.4868 23.3037 14.8871L23.745 14.7009C23.8427 14.6601 23.8283 14.6564 23.7341 14.6075C23.6249 14.5508 23.5586 14.3766 23.8422 13.8737C24.1999 13.2386 23.867 12.7786 23.6539 12.571C23.5776 12.4974 23.5077 12.3622 23.506 12.2564C23.4818 10.7133 22.8948 10.1815 22.5926 10.0095C22.5005 9.95735 22.5019 9.9197 22.6066 9.90163C23.9849 9.66335 23.0518 9.67755 22.9293 9.30903C22.8015 8.92465 21.9686 9.3409 21.5361 9.45312C21.3766 9.49463 20.8745 9.58379 20.3048 9.68024C20.3309 9.6515 20.3472 9.62149 20.3389 9.58957C20.3159 9.5008 20.2889 9.43045 20.2629 9.37581C20.2176 9.2797 20.1145 9.13919 20.0328 9.07099C19.9319 8.98614 19.7676 8.90198 19.5321 8.9411C19.4538 8.95427 19.3869 8.99804 19.3298 9.06144C19.3178 9.04259 19.3059 9.0233 19.2949 9.00827C19.1981 8.87583 19.0243 8.7221 18.7636 8.78345C18.462 8.85458 18.3311 9.57336 18.2781 10.0088C18.1767 10.0211 18.0504 10.03 17.9644 10.03H16.3309C16.666 9.60337 16.2765 9.34007 15.9665 9.31926C15.8836 9.31343 15.7627 9.36391 15.6304 9.43882C15.5523 9.30707 15.4125 9.22751 15.2863 9.21586C15.0799 9.1974 14.6025 9.71324 14.3754 9.97385C14.3604 9.99113 14.351 10.0105 14.3442 10.0296H10.1173V9.48939C10.1173 9.30379 9.96659 9.15309 9.78099 9.15309C9.59538 9.15309 9.44469 9.30379 9.44469 9.48939V10.0296H8.69213C8.58608 10.0296 8.56332 9.97062 8.64052 9.89821C9.12792 9.44024 10.7114 7.93405 10.63 7.7715C10.5746 7.66114 10.6411 7.48739 10.7077 7.35941C10.7565 7.26545 10.7476 7.13086 10.6592 7.07187C10.5093 6.97174 10.2456 6.854 9.87343 6.90168C9.76816 6.9152 9.60229 6.96249 9.50691 7.009C8.70011 7.40406 6.71455 9.11603 6.16229 9.59799C6.08234 9.66795 5.93193 9.7314 5.82598 9.74021C1.12273 10.1358 0.459667 11.6673 0.373939 12.2094C0.357439 12.3142 0.292519 12.4512 0.225983 12.5338C-0.175829 13.0348 0.0563865 14.0209 0.177219 14.4279C0.207427 14.5299 0.203706 14.6935 0.204783 14.7997Z'
        fill='#0F1013'
      />
      <path
        d='M16.4832 9.03879C16.4832 8.60717 16.2519 8.25696 15.9668 8.25696C15.7934 8.25696 15.6409 8.38744 15.5472 8.58577C15.4732 8.45892 15.3662 8.37711 15.2462 8.37711C15.0239 8.37711 14.8438 8.64991 14.8438 8.98621C14.8438 9.32261 15.0239 9.20565 15.2462 9.20565C15.3326 9.20565 15.4116 9.22254 15.4773 9.2244C15.5444 9.41245 15.7371 9.32017 15.9668 9.32017C16.2523 9.32017 16.4832 9.47047 16.4832 9.03879Z'
        fill='#0F1013'
      />
      <path
        d='M18.8108 8.66137C18.8972 8.66137 18.9764 8.67827 19.0422 8.68013C19.1089 8.86818 19.3016 8.77545 19.5315 8.77545C19.8164 8.77545 20.0481 8.92576 20.0481 8.49408C20.0481 8.0624 19.8164 7.71234 19.5315 7.71234C19.3583 7.71234 19.2054 7.84272 19.1117 8.04106C19.0381 7.9142 18.9311 7.83239 18.8108 7.83239C18.5888 7.83239 18.4082 8.10529 18.4082 8.44159C18.4082 8.77873 18.5883 8.66137 18.8108 8.66137Z'
        fill='#0F1013'
      />
      <path
        d='M3.31103 13C2.31094 13 1.5 13.8107 1.5 14.811C1.5 14.8881 1.50631 14.964 1.51601 15.0385C1.62829 15.9312 2.38805 16.6216 3.31054 16.6216C4.25825 16.6216 5.03524 15.8931 5.1143 14.9653C5.11842 14.9146 5.12181 14.8629 5.12181 14.8108C5.1223 13.8107 4.31136 13 3.31103 13ZM2.40454 14.1286L2.77339 14.498C2.74478 14.5472 2.72222 14.6003 2.70767 14.657H2.18726C2.21418 14.4601 2.2896 14.2802 2.40454 14.1286ZM2.18532 14.9706H2.70986C2.72465 15.0264 2.74647 15.0792 2.77558 15.1277L2.40576 15.4976C2.29057 15.3472 2.21321 15.1673 2.18532 14.9706ZM3.15437 15.936C2.95818 15.9086 2.77994 15.8317 2.6291 15.718L2.99723 15.3496C3.04573 15.378 3.09884 15.3989 3.15437 15.4134V15.936ZM3.15437 14.2086C3.09738 14.2237 3.04403 14.246 2.99432 14.2753L2.62547 13.9065C2.77703 13.7913 2.95673 13.7151 3.15437 13.6877V14.2086ZM3.46817 13.6873C3.66557 13.7147 3.84575 13.7913 3.99707 13.9062L3.62822 14.2751C3.57875 14.2457 3.52492 14.223 3.46817 14.2084V13.6873ZM3.46817 15.9355V15.4137C3.52395 15.3989 3.57657 15.3782 3.62507 15.3496L3.99344 15.718C3.8426 15.8317 3.66387 15.9081 3.46817 15.9355ZM4.21775 15.4993L3.84648 15.128C3.87558 15.079 3.89934 15.0271 3.91389 14.9711H4.43431C4.40667 15.1668 4.33294 15.3482 4.21775 15.4993ZM3.91462 14.657C3.89983 14.6003 3.87776 14.5472 3.8489 14.498L4.21824 14.1286C4.3327 14.2802 4.40788 14.4601 4.43528 14.6573H3.91462V14.657Z'
        fill='#0F1013'
      />
      <path
        d='M20.811 13C19.8109 13 19 13.8107 19 14.811C19 14.8881 19.0063 14.964 19.016 15.0385C19.1283 15.9312 19.8881 16.6216 20.8105 16.6216C21.7583 16.6216 22.5352 15.8931 22.6143 14.9653C22.6184 14.9146 22.6218 14.8629 22.6218 14.8108C22.6223 13.8107 21.8114 13 20.811 13ZM19.9045 14.1286L20.2734 14.498C20.2448 14.5472 20.2222 14.6003 20.2077 14.657H19.6873C19.7142 14.4601 19.7896 14.2802 19.9045 14.1286ZM19.6853 14.9706H20.2099C20.2247 15.0264 20.2465 15.0792 20.2756 15.1277L19.9058 15.4976C19.7906 15.3472 19.7132 15.1673 19.6853 14.9706ZM20.6544 15.936C20.4582 15.9086 20.2799 15.8317 20.1291 15.718L20.4972 15.3496C20.5457 15.378 20.5988 15.3989 20.6544 15.4134V15.936ZM20.6544 14.2086C20.5974 14.2237 20.544 14.246 20.4943 14.2753L20.1255 13.9065C20.277 13.7913 20.4567 13.7151 20.6544 13.6877V14.2086ZM20.9682 13.6873C21.1656 13.7147 21.3458 13.7913 21.4971 13.9062L21.1282 14.2751C21.0788 14.2457 21.0249 14.223 20.9682 14.2084V13.6873ZM20.9682 15.9355V15.4137C21.0239 15.3989 21.0766 15.3782 21.1251 15.3496L21.4934 15.718C21.3426 15.8317 21.1639 15.9081 20.9682 15.9355ZM21.7178 15.4993L21.3465 15.128C21.3756 15.079 21.3993 15.0271 21.4139 14.9711H21.9343C21.9067 15.1668 21.8329 15.3482 21.7178 15.4993ZM21.4146 14.657C21.3998 14.6003 21.3778 14.5472 21.3489 14.498L21.7182 14.1286C21.8327 14.2802 21.9079 14.4601 21.9353 14.6573H21.4146V14.657Z'
        fill='#0F1013'
      />
    </g>
    <defs>
      <clipPath id='clip0_871_4417'>
        <rect width={size} height={size} fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const GasolineIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M16 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V4C18 2.89543 17.1046 2 16 2Z'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M18 6L22 10V15C22 15.5304 21.7893 16.0391 21.4142 16.4142C21.0391 16.7893 20.5304 17 20 17C19.4696 17 18.9609 16.7893 18.5858 16.4142C18.2107 16.0391 18 15.5304 18 15V10'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10 7H14'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const DiselIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M16 2H8C6.89543 2 6 2.89543 6 4V20C6 21.1046 6.89543 22 8 22H16C17.1046 22 18 21.1046 18 20V4C18 2.89543 17.1046 2 16 2Z'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M18 6L22 10V15C22 15.5304 21.7893 16.0391 21.4142 16.4142C21.0391 16.7893 20.5304 17 20 17C19.4696 17 18.9609 16.7893 18.5858 16.4142C18.2107 16.0391 18 15.5304 18 15V10'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10 7H14'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const ElectricIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M5 18H3C2.46957 18 1.96086 17.7893 1.58579 17.4142C1.21071 17.0391 1 16.5304 1 16V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H6.19M15 6H17C17.5304 6 18.0391 6.21071 18.4142 6.58579C18.7893 6.96086 19 7.46957 19 8V16C19 16.5304 18.7893 17.0391 18.4142 17.4142C18.0391 17.7893 17.5304 18 17 18H13.81'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M23 13V11'
      stroke='black'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M11 6L7 12H13L9 18'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const HybridIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_871_559)'>
      <path
        d='M11.9357 0.250176C11.5215 0.252442 11.1876 0.59006 11.1898 1.00427C11.1921 1.41847 11.5297 1.75242 11.9439 1.75015L11.9357 0.250176ZM2.28847 6.83416L1.65477 6.433C1.64467 6.44895 1.63518 6.46528 1.62632 6.48194L2.28847 6.83416ZM3.1337 6.90115C3.35525 6.55117 3.25114 6.08785 2.90115 5.8663C2.55117 5.64475 2.08785 5.74886 1.8663 6.09885L3.1337 6.90115ZM11.9439 1.75015C14.1874 1.73788 16.373 2.46203 18.1653 3.81151L19.0676 2.61319C17.013 1.06623 14.5076 0.236108 11.9357 0.250176L11.9439 1.75015ZM18.1653 3.81151C19.9576 5.16098 21.2577 7.06123 21.866 9.22072L23.3098 8.814C22.6125 6.33849 21.1222 4.16015 19.0676 2.61319L18.1653 3.81151ZM21.866 9.22072C22.4743 11.3802 22.3574 13.6796 21.533 15.7662L22.9281 16.3174C23.8731 13.9255 24.0072 11.2895 23.3098 8.814L21.866 9.22072ZM21.533 15.7662C20.7086 17.8528 19.2224 19.6113 17.3024 20.7719L18.0784 22.0556C20.2794 20.7252 21.9831 18.7094 22.9281 16.3174L21.533 15.7662ZM17.3024 20.7719C15.3824 21.9325 13.1346 22.4311 10.9039 22.1912L10.7435 23.6826C13.3007 23.9576 15.8774 23.3861 18.0784 22.0556L17.3024 20.7719ZM10.9039 22.1912C8.67327 21.9513 6.58292 20.9861 4.9536 19.4438L3.92242 20.5332C5.79017 22.3012 8.18643 23.4076 10.7435 23.6826L10.9039 22.1912ZM4.9536 19.4438C3.32429 17.9015 2.246 15.8672 1.88418 13.653L0.40382 13.8949C0.818585 16.4331 2.05467 18.7651 3.92242 20.5332L4.9536 19.4438ZM1.88418 13.653C1.52237 11.4388 1.89701 9.16712 2.95062 7.18637L1.62632 6.48194C0.418518 8.75255 -0.010945 11.3567 0.40382 13.8949L1.88418 13.653ZM2.92217 7.23531L3.1337 6.90115L1.8663 6.09885L1.65477 6.433L2.92217 7.23531Z'
        fill='#0F1013'
      />
      <path
        d='M4.25001 1.53003L4.78034 0.9997C4.48745 0.706806 4.01258 0.706806 3.71968 0.9997L4.25001 1.53003ZM7.43201 4.71203L7.96234 5.24236C8.103 5.10171 8.18201 4.91094 8.18201 4.71203C8.18201 4.51312 8.103 4.32235 7.96234 4.1817L7.43201 4.71203ZM5.31068 5.7727C5.02938 6.05401 4.64784 6.21204 4.25001 6.21204V7.71204C5.04567 7.71204 5.80873 7.39597 6.37134 6.83336L5.31068 5.7727ZM4.25001 6.21204C3.85219 6.21204 3.47065 6.05401 3.18934 5.7727L2.12868 6.83336C2.6913 7.39597 3.45436 7.71204 4.25001 7.71204V6.21204ZM3.18934 5.7727C2.90804 5.49139 2.75 5.10986 2.75 4.71203H1.25C1.25 5.50768 1.56607 6.27075 2.12868 6.83336L3.18934 5.7727ZM2.75 4.71203C2.75 4.3142 2.90804 3.93267 3.18934 3.65136L2.12868 2.5907C1.56607 3.15331 1.25 3.91638 1.25 4.71203H2.75ZM3.18934 3.65136L4.78034 2.06036L3.71968 0.9997L2.12868 2.5907L3.18934 3.65136ZM3.71968 2.06036L6.90168 5.24236L7.96234 4.1817L4.78034 0.9997L3.71968 2.06036ZM6.90168 4.1817L5.31068 5.7727L6.37134 6.83336L7.96234 5.24236L6.90168 4.1817Z'
        fill='#0F1013'
      />
      <path
        d='M4.24921 1.52942C3.95618 1.82218 3.95596 2.29705 4.24871 2.59008C4.54147 2.88311 5.01634 2.88334 5.30937 2.59058L4.24921 1.52942ZM6.37037 1.53058C6.6634 1.23782 6.66363 0.762951 6.37087 0.46992C6.07812 0.176889 5.60324 0.176665 5.31021 0.46942L6.37037 1.53058ZM5.30937 2.59058L6.37037 1.53058L5.31021 0.46942L4.24921 1.52942L5.30937 2.59058Z'
        fill='#0F1013'
      />
      <path
        d='M6.37176 3.65189C6.07901 3.94492 6.07923 4.4198 6.37226 4.71255C6.6653 5.00531 7.14017 5.00508 7.43292 4.71205L6.37176 3.65189ZM8.49292 3.65105C8.78568 3.35802 8.78545 2.88315 8.49242 2.59039C8.19939 2.29764 7.72452 2.29786 7.43176 2.59089L8.49292 3.65105ZM7.43292 4.71205L8.49292 3.65105L7.43176 2.59089L6.37176 3.65189L7.43292 4.71205Z'
        fill='#0F1013'
      />
      <path
        d='M12 7L12.6171 6.57374C12.4771 6.37101 12.2464 6.25 12 6.25C11.7536 6.25 11.5229 6.37101 11.3829 6.57374L12 7ZM14.25 13C14.25 13.5967 14.0129 14.169 13.591 14.591L14.6517 15.6517C15.3549 14.9484 15.75 13.9946 15.75 13H14.25ZM13.591 14.591C13.169 15.0129 12.5967 15.25 12 15.25V16.75C12.9946 16.75 13.9484 16.3549 14.6517 15.6517L13.591 14.591ZM12 15.25C11.4033 15.25 10.831 15.0129 10.409 14.591L9.34835 15.6517C10.0516 16.3549 11.0054 16.75 12 16.75V15.25ZM10.409 14.591C9.98705 14.169 9.75 13.5967 9.75 13H8.25C8.25 13.9946 8.64509 14.9484 9.34835 15.6517L10.409 14.591ZM9.75 13C9.75 12.7561 9.87648 12.3 10.1554 11.6651C10.4208 11.061 10.7805 10.3898 11.1487 9.75496C11.5156 9.12262 11.8835 8.53914 12.1602 8.11299C12.2984 7.90024 12.4134 7.72748 12.4935 7.60836C12.5335 7.54882 12.5648 7.50273 12.5859 7.4718C12.5964 7.45633 12.6044 7.44466 12.6097 7.437C12.6123 7.43317 12.6143 7.43034 12.6155 7.42855C12.6161 7.42765 12.6166 7.427 12.6168 7.42662C12.6168 7.42664 12.6171 7.42626 12 7C11.3829 6.57374 11.383 6.57366 11.3829 6.57374C11.3829 6.57379 11.383 6.57364 11.3829 6.57374C11.3828 6.57394 11.3823 6.57462 11.3821 6.57496C11.3816 6.57563 11.381 6.57657 11.3801 6.57776C11.3785 6.58015 11.3761 6.58358 11.3731 6.58801C11.367 6.59689 11.3581 6.60981 11.3467 6.62656C11.3239 6.66006 11.2907 6.70889 11.2487 6.77134C11.1648 6.8962 11.0453 7.07568 10.9023 7.29598C10.6165 7.73592 10.2344 8.34175 9.85126 9.00229C9.4695 9.66036 9.0792 10.3855 8.7821 11.0618C8.49852 11.7072 8.25 12.4154 8.25 13H9.75ZM12 7C11.3829 7.42626 11.3829 7.42623 11.3829 7.42621C11.3831 7.42659 11.3839 7.42765 11.3845 7.42855C11.3857 7.43034 11.3877 7.43317 11.3903 7.437C11.3956 7.44466 11.4036 7.45633 11.4141 7.4718C11.4352 7.50273 11.4665 7.54882 11.5065 7.60836C11.5866 7.72748 11.7016 7.90024 11.8398 8.11299C12.1165 8.53914 12.4844 9.12262 12.8513 9.75496C13.2195 10.3898 13.5792 11.061 13.8446 11.6651C14.1235 12.3 14.25 12.7561 14.25 13H15.75C15.75 12.4154 15.5015 11.7072 15.2179 11.0618C14.9208 10.3855 14.5305 9.66036 14.1487 9.00229C13.7656 8.34175 13.3835 7.73592 13.0977 7.29598C12.9547 7.07568 12.8352 6.8962 12.7513 6.77134C12.7093 6.70889 12.6761 6.66006 12.6533 6.62656C12.6419 6.60981 12.633 6.59689 12.6269 6.58801C12.6239 6.58358 12.6215 6.58015 12.6199 6.57776C12.619 6.57657 12.6184 6.57563 12.6179 6.57496C12.6177 6.57462 12.618 6.57516 12.6179 6.57496C12.6178 6.57486 12.6171 6.57379 12.6171 6.57374C12.617 6.57366 12.6171 6.57374 12 7Z'
        fill='#0F1013'
      />
    </g>
    <defs>
      <clipPath id='clip0_871_559'>
        <rect width={size} height={size} fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const EmailIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M22 6L12 13L2 6'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const PhoneIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 21'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M14.166 2.16675H5.83268C4.91221 2.16675 4.16602 2.91294 4.16602 3.83341V17.1667C4.16602 18.0872 4.91221 18.8334 5.83268 18.8334H14.166C15.0865 18.8334 15.8327 18.0872 15.8327 17.1667V3.83341C15.8327 2.91294 15.0865 2.16675 14.166 2.16675Z'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10 15.5H10.0083'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const GoogleColorIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 21 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M19.6875 10.2131C19.6875 9.54832 19.6279 8.90912 19.5171 8.29541H10.6875V11.9218H15.7329C15.5156 13.0937 14.8552 14.0866 13.8622 14.7514V17.1037H16.8921C18.6648 15.4716 19.6875 13.0682 19.6875 10.2131Z'
      fill='#4285F4'
    />
    <path
      d='M10.6875 19.375C13.2187 19.375 15.3409 18.5355 16.892 17.1037L13.8622 14.7515C13.0227 15.314 11.9488 15.6463 10.6875 15.6463C8.24572 15.6463 6.17897 13.9971 5.44172 11.7812H2.30963V14.2103C3.85229 17.2742 7.02272 19.375 10.6875 19.375Z'
      fill='#34A853'
    />
    <path
      d='M5.44172 11.7812C5.25422 11.2187 5.14772 10.6179 5.14772 9.99996C5.14772 9.38203 5.25422 8.78121 5.44172 8.21871V5.78973H2.30963C1.67475 7.05539 1.3125 8.48719 1.3125 9.99996C1.3125 11.5127 1.67475 12.9445 2.30963 14.2102L5.44172 11.7812Z'
      fill='#FBBC04'
    />
    <path
      d='M10.6875 4.35372C12.0639 4.35372 13.2997 4.82669 14.2713 5.75566L16.9602 3.06672C15.3367 1.55397 13.2145 0.625 10.6875 0.625C7.02273 0.625 3.85229 2.72584 2.30963 5.78978L5.44173 8.21875C6.17898 6.00287 8.24572 4.35372 10.6875 4.35372Z'
      fill='#E94235'
    />
  </svg>
);

export const FaceboolColorIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 21 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_1356_5786)'>
      <path
        d='M20.4601 9.98004C20.4601 4.46826 15.9918 0 10.48 0C4.96826 0 0.5 4.46826 0.5 9.98004C0.5 14.6603 3.72236 18.5876 8.06926 19.6663V13.0299H6.01138V9.98004H8.06926V8.66587C8.06926 5.26906 9.60659 3.69461 12.9415 3.69461C13.5739 3.69461 14.6649 3.81876 15.1112 3.94251V6.70698C14.8756 6.68223 14.4665 6.66986 13.9583 6.66986C12.322 6.66986 11.6896 7.28982 11.6896 8.9014V9.98004H14.9495L14.3894 13.0299H11.6896V19.887C16.6313 19.2902 20.4601 15.0826 20.4601 9.98004Z'
        fill='#0866FF'
      />
      <path
        d='M14.389 13.03L14.9491 9.98007H11.6892V8.90143C11.6892 7.28985 12.3216 6.66989 13.9579 6.66989C14.4661 6.66989 14.8753 6.68227 15.1108 6.70702V3.94255C14.6645 3.81839 13.5735 3.69464 12.9411 3.69464C9.6062 3.69464 8.06887 5.26909 8.06887 8.6659V9.98007H6.01099V13.03H8.06887V19.6663C8.84093 19.8579 9.64851 19.9601 10.4796 19.9601C10.8888 19.9601 11.2924 19.935 11.6888 19.8871V13.03H14.389Z'
        fill='white'
      />
    </g>
    <defs>
      <clipPath id='clip0_1356_5786'>
        <rect width='20' height='20' fill='white' transform='translate(0.5)' />
      </clipPath>
    </defs>
  </svg>
);

export const AppleColorIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 21 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M11.5833 1.75C11.9499 1.24328 12.4238 0.823699 12.9712 0.521199C13.5185 0.218699 14.1259 0.0407339 14.75 0C14.8044 0.56793 14.7439 1.141 14.5721 1.68505C14.4003 2.22909 14.1207 2.73298 13.75 3.16667C13.4115 3.6382 12.9584 4.01571 12.4335 4.26357C11.9086 4.51143 11.3292 4.62148 10.75 4.58333C10.6899 4.07925 10.7328 3.5682 10.876 3.08118C11.0193 2.59415 11.2599 2.14127 11.5833 1.75ZM7.41668 4.83333C5.08334 4.83333 2.58334 6.91667 2.58334 10.9167C2.58334 15 5.50001 20 7.83334 20C8.66668 20 9.91668 19.1667 11.1667 19.1667C12.4167 19.1667 13.3333 19.9167 14.5 19.9167C17.0833 19.9167 18.9167 14.5833 18.9167 14.5833C18.1204 14.2397 17.4429 13.6693 16.9686 12.9431C16.4944 12.217 16.2445 11.3673 16.25 10.5C16.2505 9.73981 16.451 8.99313 16.8313 8.33491C17.2116 7.67669 17.7583 7.13009 18.4167 6.75C17.9895 6.1094 17.4051 5.58913 16.7193 5.23896C16.0336 4.88879 15.2694 4.72043 14.5 4.75C12.8333 4.75 11.5833 5.66667 10.9167 5.66667C10.1667 5.66667 8.91668 4.83333 7.41668 4.83333Z'
      fill='#222222'
    />
  </svg>
);

export const Eye = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const EyeOff = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_1000_10558)'>
      <path
        d='M17.94 17.94C16.2306 19.243 14.1491 19.9649 12 20C5 20 1 12 1 12C2.24389 9.68192 3.96914 7.65663 6.06 6.06003M9.9 4.24002C10.5883 4.0789 11.2931 3.99836 12 4.00003C19 4.00003 23 12 23 12C22.393 13.1356 21.6691 14.2048 20.84 15.19M14.12 14.12C13.8454 14.4148 13.5141 14.6512 13.1462 14.8151C12.7782 14.9791 12.3809 15.0673 11.9781 15.0744C11.5753 15.0815 11.1752 15.0074 10.8016 14.8565C10.4281 14.7056 10.0887 14.4811 9.80385 14.1962C9.51897 13.9113 9.29439 13.572 9.14351 13.1984C8.99262 12.8249 8.91853 12.4247 8.92563 12.0219C8.93274 11.6191 9.02091 11.2219 9.18488 10.8539C9.34884 10.4859 9.58525 10.1547 9.88 9.88003'
        stroke='black'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
      <path
        d='M1 1L23 23'
        stroke='black'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_1000_10558'>
        <rect width='24' height='24' fill='white' />
      </clipPath>
    </defs>
  </svg>
);

export const AlertTriangleIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 21'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M8.57502 3.71667L1.51668 15.5C1.37116 15.752 1.29416 16.0378 1.29334 16.3288C1.29253 16.6198 1.36793 16.9059 1.51204 17.1588C1.65615 17.4116 1.86396 17.6223 2.11477 17.7699C2.36559 17.9175 2.65068 17.9968 2.94168 18H17.0583C17.3494 17.9968 17.6344 17.9175 17.8853 17.7699C18.1361 17.6223 18.3439 17.4116 18.488 17.1588C18.6321 16.9059 18.7075 16.6198 18.7067 16.3288C18.7059 16.0378 18.6289 15.752 18.4834 15.5L11.425 3.71667C11.2765 3.47176 11.0673 3.26927 10.8177 3.12874C10.5681 2.98821 10.2865 2.91438 10 2.91438C9.71357 2.91438 9.43196 2.98821 9.18235 3.12874C8.93275 3.26927 8.72358 3.47176 8.57502 3.71667Z'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10 8V11.3333'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M10 14.6667H10.0083'
      stroke='#CC0000'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const WalletIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 21 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M5.75 6.66666H9.08333'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M18.1111 7.5H15.9423C14.4554 7.5 13.25 8.61925 13.25 10C13.25 11.3807 14.4554 12.5 15.9423 12.5H18.1111C18.1806 12.5 18.2153 12.5 18.2446 12.4982C18.694 12.4708 19.0519 12.1385 19.0814 11.7212C19.0833 11.6939 19.0833 11.6617 19.0833 11.5973V8.40275C19.0833 8.33833 19.0833 8.30605 19.0814 8.27883C19.0519 7.86153 18.694 7.52913 18.2446 7.50178C18.2153 7.5 18.1806 7.5 18.1111 7.5Z'
      stroke='#0F1013'
      strokeWidth='1.5'
    />
    <path
      d='M18.2212 7.50001C18.1564 5.93976 17.9475 4.98313 17.274 4.30965C16.2977 3.33334 14.7263 3.33334 11.5837 3.33334H9.08366C5.94096 3.33334 4.36962 3.33334 3.3933 4.30965C2.41699 5.28597 2.41699 6.85731 2.41699 10C2.41699 13.1427 2.41699 14.7141 3.3933 15.6903C4.36962 16.6667 5.94096 16.6667 9.08366 16.6667H11.5837C14.7263 16.6667 16.2977 16.6667 17.274 15.6903C17.9475 15.0169 18.1564 14.0603 18.2212 12.5'
      stroke='#0F1013'
      strokeWidth='1.5'
    />
    <path
      d='M15.7422 10H15.7497'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const DashBoardIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 21 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <g clipPath='url(#clip0_1388_9918)'>
      <path
        d='M15.6672 2.77777H4.83388C3.83669 2.77777 3.02832 3.58615 3.02832 4.58333V15.4167C3.02832 16.4138 3.83669 17.2222 4.83388 17.2222H15.6672C16.6644 17.2222 17.4728 16.4138 17.4728 15.4167V4.58333C17.4728 3.58615 16.6644 2.77777 15.6672 2.77777Z'
        stroke='#030819'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M3.02832 7.29166H17.4728'
        stroke='#030819'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
      <path
        d='M7.54199 8.19443V17.2222'
        stroke='#030819'
        strokeWidth='1.5'
        strokeLinecap='round'
      />
    </g>
    <defs>
      <clipPath id='clip0_1388_9918'>
        <rect width='20' height='20' fill='white' transform='translate(0.25)' />
      </clipPath>
    </defs>
  </svg>
);

export const ChevronRightIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 8 12'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M1.5 11L6.5 6L1.5 1'
      stroke='#595959'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const FileTextIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M11.6663 1.66669H4.99967C4.55765 1.66669 4.13372 1.84228 3.82116 2.15484C3.5086 2.4674 3.33301 2.89133 3.33301 3.33335V16.6667C3.33301 17.1087 3.5086 17.5326 3.82116 17.8452C4.13372 18.1578 4.55765 18.3334 4.99967 18.3334H14.9997C15.4417 18.3334 15.8656 18.1578 16.1782 17.8452C16.4907 17.5326 16.6663 17.1087 16.6663 16.6667V6.66669L11.6663 1.66669Z'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M11.667 1.66669V6.66669H16.667'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13.3337 10.8333H6.66699'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13.3337 14.1667H6.66699'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M8.33366 7.5H7.50033H6.66699'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const LogOutIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M7.5 17.5H4.16667C3.72464 17.5 3.30072 17.3244 2.98816 17.0118C2.67559 16.6993 2.5 16.2754 2.5 15.8333V4.16667C2.5 3.72464 2.67559 3.30072 2.98816 2.98816C3.30072 2.67559 3.72464 2.5 4.16667 2.5H7.5'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M13.333 14.1666L17.4997 9.99998L13.333 5.83331'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M17.5 10H7.5'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const WalletSendIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 20 20'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
  >
    <path
      d='M14.7998 8.73592V2.33594'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M12.2402 4.89594L14.8002 2.33594L17.3602 4.89594'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M8.81699 4.16669H5.00033C4.11627 4.16669 3.26848 4.45939 2.64335 4.98032C2.01823 5.50125 1.66699 6.20775 1.66699 6.94446V13.8889C1.66699 14.6256 2.01823 15.3321 2.64335 15.853C3.26848 16.374 4.11627 16.6667 5.00033 16.6667H15.0003C15.8844 16.6667 16.7322 16.374 17.3573 15.853C17.9825 15.3321 18.3337 14.6256 18.3337 13.8889V11.0625'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M2 7.97595H4.69605C5.33257 7.97595 5.94298 8.22878 6.39306 8.67886C6.84315 9.12894 7.09605 9.73942 7.09605 10.376C7.09605 11.0125 6.84315 11.6229 6.39306 12.073C5.94298 12.5231 5.33257 12.776 4.69605 12.776H2'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M4.16699 10.4167H4.17449'
      stroke='white'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const SpeedIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M20.1691 10.2177C20.7024 11.3675 21 12.649 21 13.9999C21 15.4684 20.6483 16.8547 20.0245 18.0793C19.7216 18.674 19.0839 18.9999 18.4165 18.9999H5.58351C4.91613 18.9999 4.27839 18.674 3.97547 18.0793C3.3517 16.8547 3 15.4684 3 13.9999C3 9.02931 7.02944 4.99988 12 4.99988C13.3231 4.99988 14.5795 5.28539 15.711 5.79817M12.7071 13.2929C12.3166 12.9024 11.6834 12.9024 11.2929 13.2929C10.9024 13.6834 10.9024 14.3166 11.2929 14.7071C11.6834 15.0976 12.3166 15.0976 12.7071 14.7071C13.0976 14.3166 13.0976 13.6834 12.7071 13.2929ZM12.7071 13.2929L19.0711 6.92893'
      stroke='black'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const HeadphonesIcon = ({ size = 24, ...props }) => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M3 18V12C3 9.61305 3.94821 7.32387 5.63604 5.63604C7.32387 3.94821 9.61305 3 12 3C14.3869 3 16.6761 3.94821 18.364 5.63604C20.0518 7.32387 21 9.61305 21 12V18'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M21 19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H18C17.4696 21 16.9609 20.7893 16.5858 20.4142C16.2107 20.0391 16 19.5304 16 19V16C16 15.4696 16.2107 14.9609 16.5858 14.5858C16.9609 14.2107 17.4696 14 18 14H21V19ZM3 19C3 19.5304 3.21071 20.0391 3.58579 20.4142C3.96086 20.7893 4.46957 21 5 21H6C6.53043 21 7.03914 20.7893 7.41421 20.4142C7.78929 20.0391 8 19.5304 8 19V16C8 15.4696 7.78929 14.9609 7.41421 14.5858C7.03914 14.2107 6.53043 14 6 14H3V19Z'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const RefreshIcon = ({ size = 24, ...props }) => (
  <svg
    width='24'
    height='24'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M23 4V10H17'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M1 20V14H7'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
    <path
      d='M3.51 9.00001C4.01717 7.5668 4.87913 6.28542 6.01547 5.27543C7.1518 4.26545 8.52547 3.55978 10.0083 3.22427C11.4911 2.88877 13.0348 2.93436 14.4952 3.35679C15.9556 3.77922 17.2853 4.56473 18.36 5.64001L23 10M1 14L5.64 18.36C6.71475 19.4353 8.04437 20.2208 9.50481 20.6432C10.9652 21.0657 12.5089 21.1113 13.9917 20.7758C15.4745 20.4402 16.8482 19.7346 17.9845 18.7246C19.1209 17.7146 19.9828 16.4332 20.49 15'
      stroke='#0F1013'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
    />
  </svg>
);

export const PlusIcon: React.FC<IconSvgProps> = ({
  size = 24,
  color = 'currentColor',
  ...props
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
    >
      <path
        d='M12 5V19M5 12H19'
        stroke={color}
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
};

export const TruckIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    xmlns='http://www.w3.org/2000/svg'
    viewBox='0 0 24 24'
    fill='currentColor'
    {...props}
  >
    <path d='M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25ZM13.5 15h-12v2.625c0 1.035.84 1.875 1.875 1.875h.375a3 3 0 1 1 6 0h3a.75.75 0 0 0 .75-.75V15Z' />
    <path d='M8.25 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM15.75 6.75a.75.75 0 0 0-.75.75v11.25c0 .087.015.17.042.248a3 3 0 0 1 5.958.464c.853-.175 1.522-.935 1.464-1.883a18.659 18.659 0 0 0-3.732-10.104 1.837 1.837 0 0 0-1.47-.725H15.75Z' />
    <path d='M19.5 19.5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z' />
  </svg>
);

export const VanIcon = ({ size = 24, ...props }) => (
  <svg
    fill='currentColor'
    version='1.1'
    id='Capa_1'
    xmlns='http://www.w3.org/2000/svg'
    xmlnsXlink='http://www.w3.org/1999/xlink'
    width={size}
    height={size}
    viewBox='0 0 345.997 345.997'
    xmlSpace='preserve'
    {...props}
  >
    <path d='M332.762,170.786c-17.161-10.29-42.142-15.061-46.393-15.823c-4.9-6.248-50.326-63.344-75.577-63.344H0V228.69h47.567 v-1.52c0-17.384,14.141-31.525,31.507-31.525c17.375,0,31.513,14.142,31.513,31.525v1.525h139.38v-1.525 c0-17.384,14.135-31.525,31.514-31.525c17.39,0,31.524,14.142,31.524,31.525v1.525h31.273l0.204-1.268 C344.796,225.573,351.803,182.195,332.762,170.786z M160.73,152.258v-51.713h52.62c18.771,0,56.156,47.23,57.742,49.236 l1.945,2.471H160.73V152.258z M333.951,189.425H315.66v-13.211l18.291,5.513V189.425z'></path>{' '}
    <path d='M282.273,199.945c-15.006,0-27.231,12.214-27.231,27.214c0,15.012,12.22,27.22,27.231,27.22 c15.006,0,27.214-12.208,27.214-27.22C309.476,212.159,297.279,199.945,282.273,199.945z M282.273,239.949 c-7.056,0-12.79-5.741-12.79-12.79c0-7.05,5.734-12.778,12.79-12.778c7.05,0,12.79,5.74,12.79,12.778 C295.063,234.208,289.323,239.949,282.273,239.949z'></path>{' '}
    <path d='M80.026,200.804c-14.529,0-26.361,11.812-26.361,26.35c0,14.537,11.826,26.373,26.361,26.373 c14.537,0,26.361-11.836,26.361-26.373C106.387,212.615,94.563,200.804,80.026,200.804z M80.026,239.577 c-6.837,0-12.427-5.572-12.427-12.424c0-6.84,5.59-12.412,12.427-12.412c6.845,0,12.421,5.566,12.421,12.412 C92.447,234.005,86.877,239.577,80.026,239.577z'></path>{' '}
    <path d='M249.428,238.016H110.329V225.31h139.099V238.016z M113.386,234.953h132.979v-6.581H113.386V234.953z'></path>{' '}
  </svg>
);

export const CheckIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M20 6L9 17L4 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PlayIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <polygon
      points="5,3 19,12 5,21"
      fill="currentColor"
    />
  </svg>
);

export const PauseIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <rect
      x="6"
      y="4"
      width="4"
      height="16"
      fill="currentColor"
    />
    <rect
      x="14"
      y="4"
      width="4"
      height="16"
      fill="currentColor"
    />
  </svg>
);

export const TrashIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M3 6H5H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const EyeIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8-11-8-11-8Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle
      cx="12"
      cy="12"
      r="3"
      stroke="currentColor"
      strokeWidth="2"
    />
  </svg>
);

export const EyeOffIcon = ({ size = 24, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <line
      x1="1"
      y1="1"
      x2="23"
      y2="23"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
