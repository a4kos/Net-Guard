"""
Net Guard Desktop GUI - Advanced Threat Analysis & Monitoring
PyQt6-based interface for deep threat analysis, ML detection, and AI insights
"""

import sys
import json
import asyncio
from typing import Optional, Dict, Any
from datetime import datetime

from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QVBoxLayout, 
    QTabWidget, QLabel, QLineEdit, QPushButton, QTextEdit, QTableWidget,
    QTableWidgetItem, QProgressBar, QComboBox, QSpinBox, 
    QStatusBar, QFrame, QMessageBox
)
from PyQt6.QtCore import QThread, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QIcon, QPixmap

from threat_intelligence import ThreatIntelligence
from ml_analyzer import get_analyzer
import ai


class AnalysisWorker(QThread):
    """Worker thread for long-running threat analysis"""
    analysis_complete = pyqtSignal(dict)
    progress_update = pyqtSignal(str)
    error_occurred = pyqtSignal(str)

    def __init__(self, threat_data: Dict[str, Any]):
        super().__init__()
        self.threat_data = threat_data

    def run(self):
        try:
            self.progress_update.emit("Starting threat intelligence scan...")
            
            # 1. Threat Intelligence Pattern Matching
            intel = ThreatIntelligence()
            code = self.threat_data.get('code', '')
            ti_results = intel.scan_code(code)
            
            self.progress_update.emit(f"Found {len(ti_results['threats'])} pattern matches")
            
            # 2. ML Analysis
            self.progress_update.emit("Running ML behavioral analysis...")
            ml_analyzer = get_analyzer()
            ml_result = ml_analyzer.analyze(self.threat_data)
            
            # 3. AI Analysis
            self.progress_update.emit("Getting AI-powered insights...")
            prompt = (
                f"Analyze threat: {self.threat_data.get('type', 'Unknown')}\n"
                f"Severity: {self.threat_data.get('severity', 'Unknown')}\n"
                f"Code snippet: {code[:500]}\n"
                f"Detected patterns: {[t['description'] for t in ti_results['threats']]}\n"
                f"ML Confidence: {ml_result['confidence']}"
            )
            
            try:
                loop = asyncio.new_event_loop()
                ai_analysis = loop.run_until_complete(ai.generate_text(prompt))
                loop.close()
            except Exception as e:
                ai_analysis = f"AI analysis unavailable: {str(e)}"
            
            self.progress_update.emit("Analysis complete")
            
            # Compile results
            result = {
                'threat_intelligence': ti_results,
                'ml_analysis': ml_result,
                'ai_analysis': ai_analysis,
                'timestamp': datetime.now().isoformat()
            }
            
            self.analysis_complete.emit(result)
            
        except Exception as e:
            self.error_occurred.emit(f"Analysis error: {str(e)}")


class ThreatAnalysisTab(QWidget):
    """Tab for analyzing individual threats"""
    
    def __init__(self):
        super().__init__()
        self.worker: Optional[AnalysisWorker] = None
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        # Input Section
        input_frame = QFrame()
        input_layout = QVBoxLayout()
        
        input_layout.addWidget(QLabel("Threat Type:"))
        self.threat_type = QComboBox()
        self.threat_type.addItems(["data_exfil", "keylogger", "crypto_miner", "obfuscation", 
                                   "credential_theft", "c2_communication", "unknown"])
        input_layout.addWidget(self.threat_type)
        
        input_layout.addWidget(QLabel("Severity:"))
        self.severity = QComboBox()
        self.severity.addItems(["low", "medium", "high", "critical"])
        input_layout.addWidget(self.severity)
        
        input_layout.addWidget(QLabel("Risk Score (0-100):"))
        self.risk_score = QSpinBox()
        self.risk_score.setRange(0, 100)
        self.risk_score.setValue(50)
        input_layout.addWidget(self.risk_score)
        
        input_layout.addWidget(QLabel("Code/Behavior Snippet:"))
        self.code_input = QTextEdit()
        self.code_input.setPlaceholderText("Paste the suspicious code or behavior pattern here...")
        self.code_input.setMinimumHeight(120)
        input_layout.addWidget(self.code_input)
        
        input_layout.addWidget(QLabel("Extension ID (optional):"))
        self.extension_id = QLineEdit()
        self.extension_id.setPlaceholderText("chrome://extensions UUID")
        input_layout.addWidget(self.extension_id)
        
        input_frame.setLayout(input_layout)
        layout.addWidget(input_frame)
        
        # Analysis Button
        analyze_btn = QPushButton("Analyze Threat")
        analyze_btn.clicked.connect(self.run_analysis)
        analyze_btn.setMinimumHeight(40)
        analyze_btn.setStyleSheet("background-color: #667eea; color: white; font-weight: bold;")
        layout.addWidget(analyze_btn)
        
        # Progress
        self.progress = QProgressBar()
        self.progress.setVisible(False)
        layout.addWidget(self.progress)
        
        # Status
        self.status_label = QLabel("Ready")
        layout.addWidget(self.status_label)
        
        # Results Section
        layout.addWidget(QLabel("Analysis Results:"))
        
        self.results_display = QTextEdit()
        self.results_display.setReadOnly(True)
        self.results_display.setMinimumHeight(300)
        layout.addWidget(self.results_display)
        
        self.setLayout(layout)
    
    def run_analysis(self):
        if not self.code_input.toPlainText().strip():
            QMessageBox.warning(self, "Input Error", "Please provide code or behavior data to analyze")
            return
        
        threat_data = {
            'type': self.threat_type.currentText(),
            'severity': self.severity.currentText(),
            'score': self.risk_score.value(),
            'code': self.code_input.toPlainText(),
            'extensionId': self.extension_id.text() or 'unknown'
        }
        
        self.worker = AnalysisWorker(threat_data)
        self.worker.analysis_complete.connect(self.on_analysis_complete)
        self.worker.progress_update.connect(self.on_progress_update)
        self.worker.error_occurred.connect(self.on_error)
        
        self.progress.setVisible(True)
        self.progress.setValue(0)
        self.results_display.clear()
        self.status_label.setText("Analyzing threat...")
        
        self.worker.start()
    
    def on_progress_update(self, message: str):
        self.status_label.setText(message)
        self.progress.setValue(min(self.progress.value() + 20, 90))
    
    def on_analysis_complete(self, result: Dict[str, Any]):
        self.progress.setValue(100)
        
        # Format results
        output = "=" * 80 + "\nTHREAT ANALYSIS REPORT\n" + "=" * 80 + "\n\n"
        
        output += "THREAT INTELLIGENCE (Pattern Matching)\n"
        output += "-" * 40 + "\n"
        ti = result['threat_intelligence']
        output += f"Risk Score: {ti['risk_score']}\n"
        output += f"Threats Detected: {ti['threat_count']}\n"
        if ti['threats']:
            output += "Patterns Found:\n"
            for threat in ti['threats']:
                output += f"  • {threat['type']}: {threat['description']} [{threat['severity']}]\n"
        else:
            output += "No known malicious patterns detected.\n"
        
        output += "\n\nML BEHAVIORAL ANALYSIS (Isolation Forest)\n"
        output += "-" * 40 + "\n"
        ml = result['ml_analysis']
        output += f"Is Threat: {ml['is_threat']}\n"
        output += f"Confidence: {ml['confidence'] * 100:.1f}%\n"
        output += f"Risk Level: {ml['risk_level'].upper()}\n"
        
        output += "\n\nAI-POWERED INSIGHT (Groq - Llama 3.3)\n"
        output += "-" * 40 + "\n"
        output += result['ai_analysis'] + "\n"
        
        output += "\n\n" + "=" * 80
        output += f"\nAnalysis Timestamp: {result['timestamp']}\n"
        
        self.results_display.setText(output)
        self.status_label.setText("Analysis complete!")
    
    def on_error(self, error_msg: str):
        self.progress.setVisible(False)
        self.status_label.setText(f"Error: {error_msg}")
        self.results_display.setText(f"ERROR:\n{error_msg}")


class PermissionAnalysisTab(QWidget):
    """Tab for analyzing extension permissions"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        layout.addWidget(QLabel("Analyze Extension Permissions:"))
        
        # Permissions input
        self.permissions_input = QTextEdit()
        self.permissions_input.setPlaceholderText(
            "Enter permissions (one per line) or JSON array.\n"
            "Examples:\n"
            "<all_urls>\n"
            "webRequest\n"
            "cookies\n"
            "debugger"
        )
        self.permissions_input.setMinimumHeight(150)
        layout.addWidget(self.permissions_input)
        
        # Analyze button
        analyze_btn = QPushButton("Analyze Permissions")
        analyze_btn.clicked.connect(self.analyze_permissions)
        analyze_btn.setMinimumHeight(40)
        analyze_btn.setStyleSheet("background-color: #667eea; color: white; font-weight: bold;")
        layout.addWidget(analyze_btn)
        
        # Results
        layout.addWidget(QLabel("Permission Risk Analysis:"))
        self.results_display = QTextEdit()
        self.results_display.setReadOnly(True)
        self.results_display.setMinimumHeight(250)
        layout.addWidget(self.results_display)
        
        self.setLayout(layout)
    
    def analyze_permissions(self):
        text = self.permissions_input.toPlainText().strip()
        if not text:
            QMessageBox.warning(self, "Input Error", "Please enter permissions to analyze")
            return
        
        # Parse permissions
        try:
            if text.startswith('['):
                permissions = json.loads(text)
            else:
                permissions = [p.strip() for p in text.split('\n') if p.strip()]
        except json.JSONDecodeError:
            QMessageBox.critical(self, "Parse Error", "Invalid JSON format")
            return
        
        # Analyze using threat intelligence
        intel = ThreatIntelligence()
        analysis = intel.analyze_permissions(permissions)
        
        # Format results
        output = "PERMISSION RISK ASSESSMENT\n"
        output += "=" * 60 + "\n\n"
        output += f"Total Risk Score: {analysis['risk_score']}\n\n"
        
        if analysis['flags']:
            output += "⚠️ Risk Flags:\n"
            for flag in analysis['flags']:
                output += f"  • {flag}\n"
        else:
            output += "✓ No major permission risks detected\n"
        
        output += "\n" + "=" * 60 + "\n"
        output += f"Analyzed {len(permissions)} permissions\n"
        
        self.results_display.setText(output)


class StatisticsTab(QWidget):
    """Tab for viewing statistics and trends"""
    
    def __init__(self):
        super().__init__()
        self.init_ui()
    
    def init_ui(self):
        layout = QVBoxLayout()
        
        layout.addWidget(QLabel("Statistics & Trends"))
        
        # Stats table
        self.stats_table = QTableWidget()
        self.stats_table.setColumnCount(2)
        self.stats_table.setHorizontalHeaderLabels(["Metric", "Value"])
        self.stats_table.setMinimumHeight(250)
        
        # Add sample stats
        self.update_stats()
        layout.addWidget(self.stats_table)
        
        # AI Analysis History
        layout.addWidget(QLabel("Recent Analyses:"))
        self.history_table = QTableWidget()
        self.history_table.setColumnCount(4)
        self.history_table.setHorizontalHeaderLabels(["Time", "Threat Type", "Severity", "Confidence"])
        self.history_table.setMinimumHeight(200)
        layout.addWidget(self.history_table)
        
        self.setLayout(layout)
    
    def update_stats(self):
        stats = [
            ("ML Model Status", "Trained"),
            ("AI API Status", "Connected"),
            ("Threat Intelligence DB", "Updated"),
            ("System Ready", "Yes"),
        ]
        
        self.stats_table.setRowCount(len(stats))
        for i, (metric, value) in enumerate(stats):
            self.stats_table.setItem(i, 0, QTableWidgetItem(metric))
            self.stats_table.setItem(i, 1, QTableWidgetItem(value))


class NetGuardGUI(QMainWindow):
    """Main application window"""
    
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Net Guard Desktop - Advanced Threat Analysis")
        self.setWindowIcon(self.create_icon())
        self.setGeometry(100, 100, 1200, 800)
        
        # Central widget
        central_widget = QWidget()
        central_layout = QVBoxLayout()
        
        # Header
        header = QLabel("Net Guard Desktop - ML & AI-Powered Threat Detection")
        header_font = QFont()
        header_font.setPointSize(14)
        header_font.setBold(True)
        header.setFont(header_font)
        header.setStyleSheet("color: #667eea; padding: 10px;")
        central_layout.addWidget(header)
        
        # Tabs
        self.tabs = QTabWidget()
        self.tabs.addTab(ThreatAnalysisTab(), "Threat Analysis")
        self.tabs.addTab(PermissionAnalysisTab(), "Permission Analysis")
        self.tabs.addTab(StatisticsTab(), "Statistics")
        
        central_layout.addWidget(self.tabs)
        
        # Status bar
        status_bar = QStatusBar()
        self.setStatusBar(status_bar)
        status_bar.showMessage("Net Guard Desktop v1.0.0 - Ready")
        
        central_widget.setLayout(central_layout)
        self.setCentralWidget(central_widget)
        
        self.setStyleSheet("""
            QMainWindow {
                background-color: #0a0e1a;
                color: #e0e0e0;
            }
            QTabWidget::pane {
                border: 1px solid #2a2d3a;
            }
            QTabBar::tab {
                background-color: #1a1e2e;
                color: #a0a0a0;
                padding: 8px 20px;
                margin-right: 2px;
            }
            QTabBar::tab:selected {
                background-color: #667eea;
                color: white;
            }
            QLabel {
                color: #e0e0e0;
            }
            QPushButton {
                border-radius: 4px;
                padding: 6px 12px;
                font-weight: bold;
                border: none;
            }
            QPushButton:hover {
                opacity: 0.9;
            }
            QTextEdit, QLineEdit, QComboBox, QSpinBox {
                background-color: #1a1e2e;
                color: #e0e0e0;
                border: 1px solid #2a2d3a;
                border-radius: 4px;
                padding: 5px;
            }
            QTableWidget {
                background-color: #1a1e2e;
                gridline-color: #2a2d3a;
            }
            QHeaderView::section {
                background-color: #0f1117;
                color: #667eea;
                padding: 5px;
                border: none;
                border-right: 1px solid #2a2d3a;
            }
        """)
    
    def create_icon(self) -> QIcon:
        """Create a simple icon for the app"""
        icon = QIcon()
        # Create a 32x32 pixmap with dark background and blue accent
        pixmap = QPixmap(32, 32)
        pixmap.fill(QColor("#667eea"))
        icon.addPixmap(pixmap)
        return icon


def main():
    app = QApplication(sys.argv)
    window = NetGuardGUI()
    window.show()
    sys.exit(app.exec())


if __name__ == '__main__':
    main()
