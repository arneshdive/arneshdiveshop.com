interface WaveDividerProps {
  className?: string;
  fill?: string;
}

export function WaveDivider({ className = '', fill = 'white' }: WaveDividerProps) {
  return (
    <div className={`absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-[0] translate-y-[1px] ${className}`}>
      <svg
        className="relative block w-full h-[60px] lg:h-[80px]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
      >
        <path
          d="M0,65 C15,45 25,85 45,55 C65,30 75,80 95,70 C115,55 125,75 145,60 C165,40 175,85 195,50 C215,35 230,80 250,65 C270,50 280,78 300,58 C320,42 335,82 355,62 C375,48 385,75 405,55 C425,38 440,83 460,68 C480,52 490,78 510,60 C530,45 545,80 565,58 C585,40 595,82 615,65 C635,50 650,76 670,55 C690,38 700,80 720,62 C740,48 755,78 775,58 C795,42 805,82 825,65 C845,50 860,75 880,55 C900,38 910,80 930,60 C950,45 965,78 985,58 C1005,42 1015,82 1035,68 C1055,52 1070,76 1090,55 C1110,40 1120,80 1140,62 C1160,48 1175,78 1195,58 C1215,42 1225,82 1245,65 C1265,50 1280,76 1300,55 C1320,40 1330,80 1350,62 C1370,48 1385,78 1405,58 C1425,42 1435,80 1440,65 L1440,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
}
