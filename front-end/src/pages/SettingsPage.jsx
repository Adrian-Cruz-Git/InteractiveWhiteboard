import { useState } from "react";
import TopNav from "../components/TopNav";
import "./SettingsPage.css";

function SettingsPage() {
    // Drawing settings
    const [penSize, setPenSize] = useState(2);
    const [penColor, setPenColor] = useState("#000000");
    const [penOpacity, setPenOpacity] = useState(100);
    const [eraserSize, setEraserSize] = useState(10);
    const [highlighterSize, setHighlighterSize] = useState(8);
    const [highlighterOpacity, setHighlighterOpacity] = useState(50);
    
    // Canvas settings
    const [canvasColor, setCanvasColor] = useState("#ffffff");
    const [gridEnabled, setGridEnabled] = useState(false);
    const [gridSize, setGridSize] = useState(20);
    const [gridColor, setGridColor] = useState("#e0e0e0");
    const [snapToGrid, setSnapToGrid] = useState(false);
    const [infiniteCanvas, setInfiniteCanvas] = useState(true);
    
    // UI settings
    const [darkMode, setDarkMode] = useState(false);
    const [toolbarPosition, setToolbarPosition] = useState("left");
    const [showCoordinates, setShowCoordinates] = useState(false);
    const [showRuler, setShowRuler] = useState(false);
    const [zoomSensitivity, setZoomSensitivity] = useState(50);
    
    // Performance settings
    const [smoothing, setSmoothing] = useState(true);
    const [antiAliasing, setAntiAliasing] = useState(true);
    const [maxUndoSteps, setMaxUndoSteps] = useState(50);
    const [autoSave, setAutoSave] = useState(true);
    const [autoSaveInterval, setAutoSaveInterval] = useState(5);
    
    // Export settings
    const [exportFormat, setExportFormat] = useState("png");
    const [exportQuality, setExportQuality] = useState(90);
    const [exportDPI, setExportDPI] = useState(300);

    const handleSaveSettings = () => {
        const settings = {
            drawing: {
                penSize, penColor, penOpacity,
                eraserSize, highlighterSize, highlighterOpacity
            },
            canvas: {
                canvasColor, gridEnabled, gridSize, gridColor,
                snapToGrid, infiniteCanvas
            },
            ui: {
                darkMode, toolbarPosition, showCoordinates,
                showRuler, zoomSensitivity
            },
            performance: {
                smoothing, antiAliasing, maxUndoSteps,
                autoSave, autoSaveInterval
            },
            export: {
                exportFormat, exportQuality, exportDPI
            }
        };
        
        // Save to localStorage
        localStorage.setItem('whiteboardSettings', JSON.stringify(settings));
        alert('Settings saved successfully!');
    };

    const handleResetSettings = () => {
        if (window.confirm('Are you sure you want to reset all settings to default?')) {
            // Reset to defaults
            setPenSize(2);
            setPenColor("#000000");
            setPenOpacity(100);
            setEraserSize(10);
            setHighlighterSize(8);
            setHighlighterOpacity(50);
            
            setCanvasColor("#ffffff");
            setGridEnabled(false);
            setGridSize(20);
            setGridColor("#e0e0e0");
            setSnapToGrid(false);
            setInfiniteCanvas(true);
            
            setDarkMode(false);
            setToolbarPosition("left");
            setShowCoordinates(false);
            setShowRuler(false);
            setZoomSensitivity(50);
            
            setSmoothing(true);
            setAntiAliasing(true);
            setMaxUndoSteps(50);
            setAutoSave(true);
            setAutoSaveInterval(5);
            
            setExportFormat("png");
            setExportQuality(90);
            setExportDPI(300);
        }
    };

    const handleExportSettings = () => {
        const settings = {
            drawing: {
                penSize, penColor, penOpacity,
                eraserSize, highlighterSize, highlighterOpacity
            },
            canvas: {
                canvasColor, gridEnabled, gridSize, gridColor,
                snapToGrid, infiniteCanvas
            },
            ui: {
                darkMode, toolbarPosition, showCoordinates,
                showRuler, zoomSensitivity
            },
            performance: {
                smoothing, antiAliasing, maxUndoSteps,
                autoSave, autoSaveInterval
            },
            export: {
                exportFormat, exportQuality, exportDPI
            }
        };
        
        const dataStr = JSON.stringify(settings, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'whiteboard-settings.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    return (
        <div className="settings-page">
            <TopNav />
            
            <div className="settings-content">
                <h1 className="settings-title">Settings</h1>
                
                <div className="settings-grid">
                    {/* Drawing Tools Settings */}
                    <div className="settings-section">
                        <h2 className="section-title">✏️ Drawing Tools</h2>
                        
                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Pen Size</div>
                                <div className="setting-description">Default pen stroke width</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="1"
                                    max="20"
                                    value={penSize}
                                    onChange={(e) => setPenSize(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{penSize}px</span>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-label">Pen Color</div>
                            <div className="setting-control">
                                <input
                                    type="color"
                                    value={penColor}
                                    onChange={(e) => setPenColor(e.target.value)}
                                    className="color-picker"
                                />
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Pen Opacity</div>
                                <div className="setting-description">Transparency of pen strokes</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={penOpacity}
                                    onChange={(e) => setPenOpacity(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{penOpacity}%</span>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Eraser Size</div>
                                <div className="setting-description">Size of eraser tool</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="5"
                                    max="50"
                                    value={eraserSize}
                                    onChange={(e) => setEraserSize(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{eraserSize}px</span>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Highlighter Size</div>
                                <div className="setting-description">Width of highlighter strokes</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="3"
                                    max="25"
                                    value={highlighterSize}
                                    onChange={(e) => setHighlighterSize(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{highlighterSize}px</span>
                            </div>
                        </div>
                    </div>

                    {/* Canvas Settings */}
                    <div className="settings-section">
                        <h2 className="section-title">🎨 Canvas</h2>
                        
                        <div className="setting-item">
                            <div className="setting-label">Canvas Background</div>
                            <div className="setting-control">
                                <input
                                    type="color"
                                    value={canvasColor}
                                    onChange={(e) => setCanvasColor(e.target.value)}
                                    className="color-picker"
                                />
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Show Grid</div>
                                <div className="setting-description">Display grid lines on canvas</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={gridEnabled}
                                        onChange={(e) => setGridEnabled(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Grid Size</div>
                                <div className="setting-description">Spacing between grid lines</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="number"
                                    min="5"
                                    max="100"
                                    value={gridSize}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="setting-input"
                                />
                                <span className="range-value">px</span>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Snap to Grid</div>
                                <div className="setting-description">Align drawing to grid points</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={snapToGrid}
                                        onChange={(e) => setSnapToGrid(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Infinite Canvas</div>
                                <div className="setting-description">Allow unlimited canvas size</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={infiniteCanvas}
                                        onChange={(e) => setInfiniteCanvas(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* UI Settings */}
                    <div className="settings-section">
                        <h2 className="section-title">🖥️ Interface</h2>
                        
                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Dark Mode</div>
                                <div className="setting-description">Use dark theme for UI</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={darkMode}
                                        onChange={(e) => setDarkMode(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div className="setting-label">Toolbar Position</div>
                            <div className="setting-control">
                                <select
                                    value={toolbarPosition}
                                    onChange={(e) => setToolbarPosition(e.target.value)}
                                    className="setting-select"
                                >
                                    <option value="left">Left</option>
                                    <option value="right">Right</option>
                                    <option value="top">Top</option>
                                    <option value="bottom">Bottom</option>
                                </select>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Show Coordinates</div>
                                <div className="setting-description">Display cursor position</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={showCoordinates}
                                        onChange={(e) => setShowCoordinates(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Show Ruler</div>
                                <div className="setting-description">Display measurement rulers</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={showRuler}
                                        onChange={(e) => setShowRuler(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Zoom Sensitivity</div>
                                <div className="setting-description">Mouse wheel zoom speed</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={zoomSensitivity}
                                    onChange={(e) => setZoomSensitivity(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{zoomSensitivity}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Settings */}
                    <div className="settings-section">
                        <h2 className="section-title">⚡ Performance</h2>
                        
                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Stroke Smoothing</div>
                                <div className="setting-description">Smooth pen strokes for better appearance</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={smoothing}
                                        onChange={(e) => setSmoothing(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Anti-aliasing</div>
                                <div className="setting-description">Smooth edges (may impact performance)</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={antiAliasing}
                                        onChange={(e) => setAntiAliasing(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Max Undo Steps</div>
                                <div className="setting-description">Maximum number of undo operations</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="number"
                                    min="10"
                                    max="200"
                                    value={maxUndoSteps}
                                    onChange={(e) => setMaxUndoSteps(parseInt(e.target.value))}
                                    className="setting-input"
                                />
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Auto Save</div>
                                <div className="setting-description">Automatically save changes</div>
                            </div>
                            <div className="setting-control">
                                <label className="toggle-switch">
                                    <input
                                        type="checkbox"
                                        checked={autoSave}
                                        onChange={(e) => setAutoSave(e.target.checked)}
                                    />
                                    <span className="toggle-slider"></span>
                                </label>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Auto Save Interval</div>
                                <div className="setting-description">Minutes between auto saves</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="number"
                                    min="1"
                                    max="60"
                                    value={autoSaveInterval}
                                    onChange={(e) => setAutoSaveInterval(parseInt(e.target.value))}
                                    className="setting-input"
                                />
                                <span className="range-value">min</span>
                            </div>
                        </div>
                    </div>

                    {/* Export Settings */}
                    <div className="settings-section">
                        <h2 className="section-title">💾 Export</h2>
                        
                        <div className="setting-item">
                            <div className="setting-label">Export Format</div>
                            <div className="setting-control">
                                <select
                                    value={exportFormat}
                                    onChange={(e) => setExportFormat(e.target.value)}
                                    className="setting-select"
                                >
                                    <option value="png">PNG</option>
                                    <option value="jpg">JPG</option>
                                    <option value="svg">SVG</option>
                                    <option value="pdf">PDF</option>
                                </select>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Export Quality</div>
                                <div className="setting-description">Image quality for JPG exports</div>
                            </div>
                            <div className="setting-control">
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    value={exportQuality}
                                    onChange={(e) => setExportQuality(parseInt(e.target.value))}
                                    className="range-slider"
                                />
                                <span className="range-value">{exportQuality}%</span>
                            </div>
                        </div>

                        <div className="setting-item">
                            <div>
                                <div className="setting-label">Export DPI</div>
                                <div className="setting-description">Resolution for printed exports</div>
                            </div>
                            <div className="setting-control">
                                <select
                                    value={exportDPI}
                                    onChange={(e) => setExportDPI(parseInt(e.target.value))}
                                    className="setting-select"
                                >
                                    <option value="72">72 DPI (Screen)</option>
                                    <option value="150">150 DPI (Draft)</option>
                                    <option value="300">300 DPI (Print)</option>
                                    <option value="600">600 DPI (High Quality)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="settings-actions">
                    <button onClick={handleSaveSettings} className="action-btn save">
                        Save Settings
                    </button>
                    <button onClick={handleResetSettings} className="action-btn reset">
                        Reset to Default
                    </button>
                    <button onClick={handleExportSettings} className="action-btn export">
                        Export Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SettingsPage;