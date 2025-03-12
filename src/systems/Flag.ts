import type { Scene } from "phaser";
import { MapManager } from "./Map";

/**
 * FlagManager class to handle all flag-related functionality
 * This class manages flag generation, placement, and interactions
 */
export class FlagManager {
  constructor(scene) {
    this.scene = scene;
    // Generate initial flag positions
    this.generateFlags();
  }

  /**
   * Generate flags at random positions
   * @param {number} count - Number of flags to generate
   */
  generateFlags(count = 5) {
    // Get available flag positions
    const positions = this.mapManager.getAvailableFlagPositions(count);

    // Add flags
    for (const position of positions) {
      this.mapManager.addFlag(position.lat, position.lng);
    }
  }

  /**
   * Place a flag at the player's current position
   * @returns {Object|null} - The flag object if successful, null otherwise
   */
  placeFlag() {
    // Try to add a flag at the player's current position
    return this.mapManager.addFlagAtPlayerPosition();
  }

  /**
   * Get the current number of flags
   * @returns {number} - The number of flags
   */
  getFlagCount() {
    return this.mapManager.flags.length;
  }
}
