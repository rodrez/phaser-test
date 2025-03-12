import type { Scene } from "phaser";
import type { MapSystem } from "./Map";
import "../styles/popups.css";

/**
 * Interface for popup options
 */
export interface PopupOptions {
  className?: string;
  closeButton?: boolean;
  offset?: { x: number; y: number };
  width?: number;
  zIndex?: number;
}

/**
 * Interface for popup content
 */
export interface PopupContent {
  html: string;
  buttons?: {
    selector: string;
    onClick: () => void;
  }[];
}

/**
 * PopupSystem - Handles custom popups that are always on top of other elements
 */
export class PopupSystem {
  private scene: Scene;
  private mapSystem: MapSystem;
  private activePopups: HTMLElement[] = [];

  constructor(scene: Scene, mapSystem: MapSystem) {
    this.scene = scene;
    this.mapSystem = mapSystem;

    // CSS is now loaded via import statement
    console.log("PopupSystem initialized with external CSS");
  }

  /**
   * Ensures a popup stays within the viewport boundaries
   * @private
   */
  private ensurePopupVisibility(
    customPopup: HTMLElement,
    x: number,
    y: number,
    offsetX: number,
    offsetY: number,
  ): void {
    // Set initial position
    customPopup.style.left = `${x + offsetX}px`;
    customPopup.style.top = `${y + offsetY}px`;

    // We need to wait for the popup to be in the DOM to get its dimensions
    setTimeout(() => {
      const rect = customPopup.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let adjustedX = x + offsetX;
      let adjustedY = y + offsetY;

      // Check right boundary
      if (rect.right > viewportWidth) {
        adjustedX = viewportWidth - rect.width;
      }

      // Check left boundary
      if (rect.left < 0) {
        adjustedX = 0;
      }

      // Check bottom boundary
      if (rect.bottom > viewportHeight) {
        adjustedY = viewportHeight - rect.height;
      }

      // Check top boundary
      if (rect.top < 0) {
        adjustedY = 0;
      }

      // Apply adjusted position
      customPopup.style.left = `${adjustedX}px`;
      customPopup.style.top = `${adjustedY}px`;
    }, 0);
  }

  /**
   * Create a popup at a specific lat/lon position
   */
  createPopup(
    lat: number,
    lon: number,
    content: PopupContent,
    options: PopupOptions = {},
  ): HTMLElement | null {
    try {
      // Remove any existing popups with the same class
      if (options.className) {
        this.closePopupsByClass(options.className);
      }

      // Create an overlay to capture all events
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";

      // Get screen coordinates for the popup
      const screenPos = this.mapSystem.geoToScreenCoordinates(lat, lon);
      if (!screenPos) return null;

      // Create a custom popup container
      const customPopup = document.createElement("div");
      customPopup.className = `custom-popup ${options.className || ""}`;
      customPopup.style.position = "fixed";

      // Apply offset
      const offsetX = options.offset?.x || 0;
      const offsetY = options.offset?.y || -30; // Default offset above the target

      // Set custom width if provided
      if (options.width) {
        customPopup.style.width = `${options.width}px`;
        customPopup.style.minWidth = `${options.width}px`;
      }

      // Set custom z-index if provided
      if (options.zIndex) {
        customPopup.style.zIndex = `${options.zIndex}`;
      } else {
        customPopup.style.zIndex = "99999";
      }

      // Set content
      customPopup.innerHTML = content.html;

      // Add close button if requested
      if (options.closeButton !== false) {
        const closeButton = document.createElement("div");
        closeButton.className = "close-button";
        closeButton.innerHTML = "×";
        closeButton.addEventListener("click", (event) => {
          // Prevent event from propagating to elements behind the popup
          event.stopPropagation();
          this.closePopup(overlay);
        });
        customPopup.appendChild(closeButton);
      }

      // Add the popup to the overlay
      overlay.appendChild(customPopup);

      // Add the overlay to the interaction layer or body
      if (this.mapSystem.interactionElement) {
        this.mapSystem.interactionElement.appendChild(overlay);
      } else {
        document.body.appendChild(overlay);
      }

      // Ensure popup stays within viewport boundaries
      this.ensurePopupVisibility(
        customPopup,
        screenPos.x,
        screenPos.y,
        offsetX,
        offsetY,
      );

      // Prevent all mouse events from propagating through the popup
      const mouseEvents = [
        "click",
        "mousedown",
        "mouseup",
        "mousemove",
        "mouseover",
        "mouseout",
        "mouseenter",
        "mouseleave",
        "contextmenu",
      ];
      for (const eventType of mouseEvents) {
        customPopup.addEventListener(eventType, (event) => {
          event.stopPropagation();
          event.preventDefault();
        });
      }

      // Register event handlers for buttons
      if (content.buttons) {
        for (const button of content.buttons) {
          const elements = customPopup.querySelectorAll(button.selector);
          for (const element of elements) {
            element.addEventListener("click", (event) => {
              // Prevent event from propagating to elements behind the popup
              event.stopPropagation();
              event.preventDefault();
              button.onClick();
            });
          }
        }
      }

      // Add a subtle entrance animation
      customPopup.style.opacity = "0";
      customPopup.style.transform = "translateY(10px)";
      customPopup.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      // Trigger animation after a small delay
      setTimeout(() => {
        customPopup.style.opacity = "1";
        customPopup.style.transform = "translateY(0)";
      }, 10);

      // Add to active popups list
      this.activePopups.push(overlay);

      return overlay;
    } catch (error) {
      console.error("Error creating popup:", error);
      return null;
    }
  }

  /**
   * Create a popup at a specific screen position
   */
  createPopupAtScreenPosition(
    x: number,
    y: number,
    content: PopupContent,
    options: PopupOptions = {},
  ): HTMLElement | null {
    try {
      // Remove any existing popups with the same class
      if (options.className) {
        this.closePopupsByClass(options.className);
      }

      // Create an overlay to capture all events
      const overlay = document.createElement("div");
      overlay.className = "popup-overlay";

      // Get screen position
      const screenPos = { x, y };

      // Create a custom popup container
      const customPopup = document.createElement("div");
      customPopup.className = `custom-popup ${options.className || ""}`;
      customPopup.style.position = "fixed";

      // Apply offset
      const offsetX = options.offset?.x || 0;
      const offsetY = options.offset?.y || -30; // Default offset above the target

      // Set custom width if provided
      if (options.width) {
        customPopup.style.width = `${options.width}px`;
        customPopup.style.minWidth = `${options.width}px`;
      }

      // Set custom z-index if provided
      if (options.zIndex) {
        customPopup.style.zIndex = `${options.zIndex}`;
      } else {
        customPopup.style.zIndex = "99999";
      }

      // Set content
      customPopup.innerHTML = content.html;

      // Add close button if requested
      if (options.closeButton !== false) {
        const closeButton = document.createElement("div");
        closeButton.className = "close-button";
        closeButton.innerHTML = "×";
        closeButton.addEventListener("click", (event) => {
          // Prevent event from propagating to elements behind the popup
          event.stopPropagation();
          this.closePopup(overlay);
        });
        customPopup.appendChild(closeButton);
      }

      // Add the popup to the overlay
      overlay.appendChild(customPopup);

      // Add the overlay to the interaction layer or body
      if (this.mapSystem.interactionElement) {
        this.mapSystem.interactionElement.appendChild(overlay);
      } else {
        document.body.appendChild(overlay);
      }

      // Ensure popup stays within viewport boundaries
      this.ensurePopupVisibility(
        customPopup,
        screenPos.x,
        screenPos.y,
        offsetX,
        offsetY,
      );

      // Prevent all mouse events from propagating through the popup
      const mouseEvents = [
        "click",
        "mousedown",
        "mouseup",
        "mousemove",
        "mouseover",
        "mouseout",
        "mouseenter",
        "mouseleave",
        "contextmenu",
      ];
      for (const eventType of mouseEvents) {
        customPopup.addEventListener(eventType, (event) => {
          event.stopPropagation();
          event.preventDefault();
        });
      }

      // Register event handlers for buttons
      if (content.buttons) {
        for (const button of content.buttons) {
          const elements = customPopup.querySelectorAll(button.selector);
          for (const element of elements) {
            element.addEventListener("click", (event) => {
              // Prevent event from propagating to elements behind the popup
              event.stopPropagation();
              event.preventDefault();
              button.onClick();
            });
          }
        }
      }

      // Add a subtle entrance animation
      customPopup.style.opacity = "0";
      customPopup.style.transform = "translateY(10px)";
      customPopup.style.transition = "opacity 0.3s ease, transform 0.3s ease";

      // Trigger animation after a small delay
      setTimeout(() => {
        customPopup.style.opacity = "1";
        customPopup.style.transform = "translateY(0)";
      }, 10);

      // Add to active popups list
      this.activePopups.push(overlay);

      return overlay;
    } catch (error) {
      console.error("Error creating popup:", error);
      return null;
    }
  }

  /**
   * Update the content of an existing popup
   */
  updatePopupContent(popup: HTMLElement, content: PopupContent): void {
    try {
      // Store the close button if it exists
      const closeButton = popup.querySelector(".close-button");

      // Update content
      popup.innerHTML = content.html;

      // Re-add close button if it existed
      if (closeButton) {
        popup.appendChild(closeButton);
      }

      // Register event handlers for buttons
      if (content.buttons) {
        for (const button of content.buttons) {
          const elements = popup.querySelectorAll(button.selector);
          for (const element of elements) {
            element.addEventListener("click", (event) => {
              // Prevent event from propagating to elements behind the popup
              event.stopPropagation();
              event.preventDefault();
              button.onClick();
            });
          }
        }
      }

      // Ensure popup clicks don't propagate to elements behind it
      popup.addEventListener("click", (event) => {
        event.stopPropagation();
        event.preventDefault();
      });
    } catch (error) {
      console.error("Error updating popup content:", error);
    }
  }

  /**
   * Close a specific popup
   */
  closePopup(popup: HTMLElement): void {
    try {
      // Add exit animation
      popup.style.opacity = "0";
      popup.style.transform = "translateY(10px)";

      // Remove after animation completes
      setTimeout(() => {
        // Remove from DOM
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }

        // Remove from active popups list
        const index = this.activePopups.indexOf(popup);
        if (index !== -1) {
          this.activePopups.splice(index, 1);
        }
      }, 300); // Match the transition duration
    } catch (error) {
      console.error("Error closing popup:", error);
    }
  }

  /**
   * Close all popups with a specific class
   */
  closePopupsByClass(className: string): void {
    try {
      // Find all popups with the specified class
      const popupsToClose = this.activePopups.filter((popup) => {
        const popupElement = popup.querySelector(`.custom-popup.${className}`);
        return popupElement !== null;
      });

      // Close each popup
      for (const popup of popupsToClose) {
        this.closePopup(popup);
      }
    } catch (error) {
      console.error("Error closing popups by class:", error);
    }
  }

  /**
   * Close all active popups
   */
  closeAllPopups(): void {
    try {
      // Create a copy of the array to avoid modification during iteration
      const popupsToClose = [...this.activePopups];

      // Close each popup
      for (const popup of popupsToClose) {
        this.closePopup(popup);
      }
    } catch (error) {
      console.error("Error closing all popups:", error);
    }
  }

  /**
   * Check if any popup is currently open
   */
  isAnyPopupOpen(): boolean {
    return this.activePopups.length > 0;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    try {
      // Close all popups
      this.closeAllPopups();

      // Clear the active popups array
      this.activePopups = [];

      // Remove any event listeners if needed
      // (Add specific cleanup code here if you have global event listeners)

      console.log("PopupSystem destroyed");
    } catch (error) {
      console.error("Error destroying PopupSystem:", error);
    }
  }
}

