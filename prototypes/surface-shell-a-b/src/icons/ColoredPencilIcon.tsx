import type { SVGProps } from "react";

// Original geometry: Microsoft Fluent UI System Icons, Edit 24 Color (MIT).
// https://github.com/microsoft/fluentui-system-icons/blob/main/assets/Edit/SVG/ic_fluent_edit_24_color.svg
// The four authored surfaces stay intact; only their semantic fills come from Tafelraum tokens.
export function ColoredPencilIcon({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      className={`tool-pencil-icon${className ? ` ${className}` : ""}`}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        className="tool-pencil-icon-body"
        d="M3.5874 15.3532L14.6459 4.29346L19.7066 9.35412L8.64828 20.4136L4.70363 19.2976L3.5874 15.3532Z"
      />
      <path
        className="tool-pencil-icon-tip"
        d="M3.94103 14.9995C3.5347 15.4059 3.2491 15.917 3.116 16.4761L2.02041 21.0775C1.96009 21.3309 2.03552 21.5974 2.21968 21.7816C2.40385 21.9657 2.67037 22.0412 2.92373 21.9808L7.52498 20.8853C8.08418 20.7522 8.59546 20.4664 9.00191 20.0599C9.00191 20.0599 7.17792 19.6504 5.76436 18.2368C4.34949 16.822 3.94103 14.9995 3.94103 14.9995Z"
      />
      <path
        className="tool-pencil-icon-end"
        d="M20.9518 3.0481C19.5543 1.65058 17.2884 1.65064 15.891 3.04825L13.5852 5.35413L18.6459 10.4148L20.9519 8.10861C22.3493 6.71112 22.3492 4.4455 20.9518 3.0481Z"
      />
      <path
        className="tool-pencil-icon-band"
        d="M12.7798 6.16065L14.9007 4.03857C14.9007 4.03857 15.3096 5.86171 16.7239 7.27601C18.138 8.69014 19.9613 9.09923 19.9613 9.09923L17.8407 11.2211C17.8407 11.2211 16.0167 10.8115 14.6031 9.39797C13.1882 7.98308 12.7798 6.16065 12.7798 6.16065Z"
      />
    </svg>
  );
}
