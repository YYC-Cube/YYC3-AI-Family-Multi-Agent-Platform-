/**
 * file: YYC3Background.tsx
 * description: 文件 · 待补充描述
 * author: YanYuCloudCube Team
 * version: v1.0.0
 * created: 2026-04-04
 * updated: 2026-04-04
 * status: active
 * tags: [file]
 *
 * brief: 待补充简要说明
 *
 * details: 待补充详细说明
 *
 * dependencies: 待补充
 * exports: 待补充
 * notes: 待补充
 */

import { motion } from "motion/react";

export function YYC3Background() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none flex items-center justify-center z-0">
      <motion.div 
        initial={{ opacity: 0.03, scale: 0.9 }}
        animate={{ 
          opacity: [0.03, 0.08, 0.03],
          scale: [0.95, 1, 0.95],
          textShadow: [
            "0 0 0px rgba(34,197,94,0)",
            "0 0 15px rgba(34,197,94,0.15)",
            "0 0 0px rgba(34,197,94,0)"
          ]
        }}
        transition={{ 
          duration: 6, 
          repeat: Infinity, 
          ease: "easeInOut" 
        }}
        className="transform scale-[0.4] sm:scale-75 md:scale-90 lg:scale-100 xl:scale-125 font-mono text-green-500 font-bold whitespace-pre text-center blur-[0.5px]"
      >
{`
██╗   ██╗██╗   ██╗ ██████╗██████╗     ██████╗ ███████╗██╗   ██╗
╚██╗ ██╔╝╚██╗ ██╔╝██╔════╝╚════██╗    ██╔══██╗██╔════╝██║   ██║
 ╚████╔╝  ╚████╔╝ ██║      █████╔╝    ██║  ██║█████╗  ██║   ██║
  ╚██╔╝    ╚██╔╝  ██║      ╚═══██╗    ██║  ██║██╔══╝  ╚██╗ ██╔╝
   ██║      ██║   ╚██████╗██████╔╝    ██████╔╝███████╗ ╚████╔╝
   ╚═╝      ╚═╝    ╚═════╝╚═════╝     ╚═════╝ ╚══════╝  ╚═══╝

       YanYu Cloud³ Developer Environment
`}
      </motion.div>
    </div>
  );
}
