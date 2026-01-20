/**
 * PullToRefresh Component
 * Custom implementation that doesn't interfere with button clicks
 * Only triggers on intentional pull-down gesture from the top of the page
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useRefresh } from "@/contexts/RefreshContext";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface PullToRefreshWrapperProps {
	children: React.ReactNode;
	className?: string;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

export function PullToRefreshWrapper({ children, className }: PullToRefreshWrapperProps) {
	const isMobile = useIsMobile();
	const { executeRefresh, hasRefreshFunction, isRefreshing } = useRefresh();
	
	const [pullDistance, setPullDistance] = useState(0);
	const [isPulling, setIsPulling] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const startY = useRef(0);
	const currentY = useRef(0);

	const shouldEnablePullToRefresh = isMobile && hasRefreshFunction;

	const handleTouchStart = useCallback((e: TouchEvent) => {
		if (!shouldEnablePullToRefresh || isRefreshing) return;
		
		const container = containerRef.current;
		if (!container) return;

		// Only start pull if we're at the top of the scroll
		if (container.scrollTop > 0) return;

		// Check if the touch target is an interactive element
		const target = e.target as HTMLElement;
		const isInteractive = target.closest('button, a, input, textarea, select, [role="button"], [onclick]');
		if (isInteractive) return;

		startY.current = e.touches[0].clientY;
		setIsPulling(true);
	}, [shouldEnablePullToRefresh, isRefreshing]);

	const handleTouchMove = useCallback((e: TouchEvent) => {
		if (!isPulling || isRefreshing) return;
		
		const container = containerRef.current;
		if (!container) return;

		// Only allow pull if at the top
		if (container.scrollTop > 0) {
			setPullDistance(0);
			return;
		}

		currentY.current = e.touches[0].clientY;
		const diff = currentY.current - startY.current;

		// Only pull down, not up
		if (diff > 0) {
			// Apply resistance
			const distance = Math.min(diff * 0.5, MAX_PULL);
			setPullDistance(distance);
			
			// Prevent default scroll when pulling
			if (distance > 10) {
				e.preventDefault();
			}
		}
	}, [isPulling, isRefreshing]);

	const handleTouchEnd = useCallback(async () => {
		if (!isPulling) return;

		setIsPulling(false);

		if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
			// Trigger refresh
			setPullDistance(PULL_THRESHOLD);
			await executeRefresh();
		}
		
		setPullDistance(0);
	}, [isPulling, pullDistance, isRefreshing, executeRefresh]);

	useEffect(() => {
		const container = containerRef.current;
		if (!container || !shouldEnablePullToRefresh) return;

		container.addEventListener('touchstart', handleTouchStart, { passive: true });
		container.addEventListener('touchmove', handleTouchMove, { passive: false });
		container.addEventListener('touchend', handleTouchEnd, { passive: true });

		return () => {
			container.removeEventListener('touchstart', handleTouchStart);
			container.removeEventListener('touchmove', handleTouchMove);
			container.removeEventListener('touchend', handleTouchEnd);
		};
	}, [shouldEnablePullToRefresh, handleTouchStart, handleTouchMove, handleTouchEnd]);

	// On desktop or when no refresh function, just render children
	if (!shouldEnablePullToRefresh) {
		return (
			<div className={cn("flex-1 flex flex-col overflow-y-auto", className)}>
				{children}
			</div>
		);
	}

	const showIndicator = pullDistance > 10 || isRefreshing;
	const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
	const rotation = progress * 180;

	return (
		<div
			ref={containerRef}
			className={cn("flex-1 flex flex-col overflow-y-auto relative", className)}
			style={{ touchAction: isPulling && pullDistance > 10 ? 'none' : 'auto' }}
		>
			{/* Pull indicator */}
			{showIndicator && (
				<div 
					className="absolute left-0 right-0 flex items-center justify-center z-50 pointer-events-none transition-opacity duration-200"
					style={{ 
						top: Math.max(0, pullDistance - 50),
						opacity: progress,
					}}
				>
					<div className="bg-background/95 backdrop-blur-sm rounded-full p-2 shadow-lg border">
						<RefreshCw 
							className={cn(
								"h-5 w-5 text-primary transition-transform",
								isRefreshing && "animate-spin"
							)}
							style={{ 
								transform: isRefreshing ? undefined : `rotate(${rotation}deg)` 
							}}
						/>
					</div>
				</div>
			)}

			{/* Content with pull transform */}
			<div 
				className="flex-1 flex flex-col"
				style={{ 
					transform: pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
					transition: isPulling ? 'none' : 'transform 0.2s ease-out'
				}}
			>
				{children}
			</div>
		</div>
	);
}

export default PullToRefreshWrapper;
