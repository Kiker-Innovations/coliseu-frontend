/**
 * ResponsiveModal Component
 * Renders as a Drawer on mobile devices and as a Dialog on desktop
 * Provides a native-like modal experience on mobile
 */

import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogClose,
} from "@/components/ui/dialog";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ResponsiveModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	children: React.ReactNode;
}

interface ResponsiveModalContentProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalHeaderProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalTitleProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalDescriptionProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalFooterProps {
	children: React.ReactNode;
	className?: string;
}

interface ResponsiveModalCloseProps {
	children: React.ReactNode;
	className?: string;
	asChild?: boolean;
}

interface ResponsiveModalBodyProps {
	children: React.ReactNode;
	className?: string;
}

const ResponsiveModalContext = React.createContext<{ isMobile: boolean }>({
	isMobile: false,
});

function ResponsiveModal({ open, onOpenChange, children }: ResponsiveModalProps) {
	const isMobile = useIsMobile();

	if (isMobile) {
		return (
			<ResponsiveModalContext.Provider value={{ isMobile: true }}>
				<Drawer open={open} onOpenChange={onOpenChange}>
					{children}
				</Drawer>
			</ResponsiveModalContext.Provider>
		);
	}

	return (
		<ResponsiveModalContext.Provider value={{ isMobile: false }}>
			<Dialog open={open} onOpenChange={onOpenChange}>
				{children}
			</Dialog>
		</ResponsiveModalContext.Provider>
	);
}

function ResponsiveModalContent({ children, className }: ResponsiveModalContentProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return (
			<DrawerContent className={cn("max-h-[90vh]", className)}>
				<ScrollArea className="max-h-[calc(90vh-2rem)] overflow-auto">
					{children}
				</ScrollArea>
			</DrawerContent>
		);
	}

	return (
		<DialogContent
			className={cn(
				"max-h-[90vh] overflow-hidden flex flex-col",
				"w-[95vw] max-w-lg sm:max-w-xl md:max-w-2xl",
				className
			)}
		>
			<ScrollArea className="flex-1 overflow-auto pr-4 -mr-4">
				{children}
			</ScrollArea>
		</DialogContent>
	);
}

function ResponsiveModalHeader({ children, className }: ResponsiveModalHeaderProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return <DrawerHeader className={cn("text-left", className)}>{children}</DrawerHeader>;
	}

	return <DialogHeader className={className}>{children}</DialogHeader>;
}

function ResponsiveModalTitle({ children, className }: ResponsiveModalTitleProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return <DrawerTitle className={className}>{children}</DrawerTitle>;
	}

	return <DialogTitle className={className}>{children}</DialogTitle>;
}

function ResponsiveModalDescription({ children, className }: ResponsiveModalDescriptionProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return <DrawerDescription className={className}>{children}</DrawerDescription>;
	}

	return <DialogDescription className={className}>{children}</DialogDescription>;
}

function ResponsiveModalBody({ children, className }: ResponsiveModalBodyProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	return (
		<div className={cn(isMobile ? "px-4 pb-4" : "py-4", className)}>
			{children}
		</div>
	);
}

function ResponsiveModalFooter({ children, className }: ResponsiveModalFooterProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return (
			<DrawerFooter className={cn("pt-2", className)}>
				{children}
			</DrawerFooter>
		);
	}

	return (
		<DialogFooter className={cn("pt-4", className)}>
			{children}
		</DialogFooter>
	);
}

function ResponsiveModalClose({ children, className, asChild }: ResponsiveModalCloseProps) {
	const { isMobile } = React.useContext(ResponsiveModalContext);

	if (isMobile) {
		return (
			<DrawerClose asChild={asChild} className={className}>
				{children}
			</DrawerClose>
		);
	}

	return (
		<DialogClose asChild={asChild} className={className}>
			{children}
		</DialogClose>
	);
}

export {
	ResponsiveModal,
	ResponsiveModalContent,
	ResponsiveModalHeader,
	ResponsiveModalTitle,
	ResponsiveModalDescription,
	ResponsiveModalBody,
	ResponsiveModalFooter,
	ResponsiveModalClose,
};

