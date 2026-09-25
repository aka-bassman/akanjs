"use client";
import { cn } from "akanjs/client";
import { st } from "akanjs/store";
import { animated } from "akanjs/ui";
import { type ReactNode, useEffect, useState } from "react";
import { AiOutlineMenu } from "react-icons/ai";
import { BiX } from "react-icons/bi";
import { useSpring } from "react-spring";
import { agentAttrs } from "../agentAttrs";
import { buttonRecipe } from "../Button";

export interface SiderProps {
  className?: string;
  bgClassName?: string;
  /** Element that opens the drawer. Defaults to the framework's hamburger button. */
  trigger?: ReactNode;
  /** Whole top row of the drawer, replacing the row the close button sits in. */
  header?: ReactNode;
  /** Element that closes the drawer, inside the default header row. */
  close?: ReactNode;
  children?: ReactNode;
}

export const Sider = ({ className, bgClassName, trigger, header, close, children }: SiderProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const path = st.use.path({ agent: false });
  const openMenu = st
    .tool("openMenu")
    .desc("Open the side navigation drawer.")
    .exec(() => {
      setIsOpen(true);
    });
  const closeMenu = st
    .tool("closeMenu")
    .desc("Close the side navigation drawer.")
    .exec(() => {
      setIsOpen(false);
    });
  useEffect(() => {
    setIsOpen(false);
  }, [path]);
  const siderAnimation = useSpring({
    translateX: isOpen ? "0%" : "-100%",
    config: { tension: 300, friction: 30 },
  });
  const overlayAnimation = useSpring({
    opacity: isOpen ? 1 : 0,
    config: { tension: 300, friction: 30 },
  });

  return (
    <>
      <div className="contents" onClick={() => void openMenu()} {...agentAttrs(openMenu)}>
        {trigger ?? (
          <button aria-label="Open menu" className={buttonRecipe({ variant: "ghost", size: "icon" })} type="button">
            <AiOutlineMenu />
          </button>
        )}
      </div>

      {isOpen ? (
        <animated.div
          style={overlayAnimation}
          className={cn("fixed inset-0 z-40 bg-black/50 backdrop-blur-sm", bgClassName)}
          onClick={() => {
            setIsOpen(false);
          }}
        />
      ) : null}

      <animated.div
        // Off-screen but still mounted, so it stays out of the tab order until it is actually reachable.
        aria-hidden={!isOpen}
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full w-3/4 flex-col border-border border-r bg-card text-card-foreground shadow-2xl md:w-80",
          !isOpen && "pointer-events-none",
          className,
        )}
        style={siderAnimation}
      >
        {header ?? (
          <div className="flex shrink-0 items-center justify-end p-2">
            <div className="contents" onClick={() => void closeMenu()} {...agentAttrs(closeMenu)}>
              {close ?? (
                <button
                  aria-label="Close menu"
                  className={buttonRecipe({ variant: "ghost", size: "icon" }, "rounded-full text-foreground/50")}
                  type="button"
                >
                  <BiX className="text-2xl" />
                </button>
              )}
            </div>
          </div>
        )}
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4">{children}</div>
      </animated.div>
    </>
  );
};
