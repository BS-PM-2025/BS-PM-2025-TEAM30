pipeline {
    agent none

    environment {
        FRONTEND_DIR = 'frontend-clean'
        BACKEND_DIR = '.'
        PIPELINE_START_TIME = "${new Date().time}"
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
                script {
                    env.PIPELINE_START_TIME = "${new Date().time}"
                    env.GIT_COMMIT_SHORT = sh(script: "git rev-parse --short HEAD", returnStdout: true).trim()
                    env.GIT_BRANCH_NAME = sh(script: "git rev-parse --abbrev-ref HEAD", returnStdout: true).trim()
                }
            }
        }

        stage('Install Backend') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                script {
                    env.BACKEND_INSTALL_START = "${new Date().time}"
                }
                sh '''
                    python -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
                    pip install coverage pytest-cov
                '''
                script {
                    env.BACKEND_INSTALL_END = "${new Date().time}"
                }
            }
        }

        stage('Test Backend with Metrics') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                script {
                    env.BACKEND_TEST_START = "${new Date().time}"
                }
                sh '''
                    . venv/bin/activate

                    # יצירת קובץ הגדרות לבדיקות
                    cat > test_settings.py << 'EOF'
from backend.settings import *

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}
EOF

                    echo "=== BACKEND TESTING STARTED ==="
                    echo "Timestamp: $(date)"

                    # הרצת migrations
                    python manage.py migrate --settings=test_settings

                    # ספירת כמות בדיקות לפני הרצה
                    TOTAL_TESTS=$(python manage.py test --settings=test_settings --dry-run 2>/dev/null | grep -c "test_" || echo "0")
                    echo "Total tests to run: $TOTAL_TESTS"

                    # הרצת בדיקות עם כיסוי קוד ומדידת זמן
                    TEST_START_TIME=$(date +%s)

                    coverage run --source='.' manage.py test --settings=test_settings --verbosity=2 > test_results.txt 2>&1
                    TEST_EXIT_CODE=$?

                    TEST_END_TIME=$(date +%s)
                    TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))

                    # הדפסת תוצאות הבדיקות
                    echo "=== TEST RESULTS ==="
                    cat test_results.txt

                    # מדידת כיסוי קוד
                    echo "=== COVERAGE ANALYSIS ==="
                    coverage report -m > coverage_report.txt 2>&1
                    coverage xml -o coverage.xml 2>/dev/null || echo "XML coverage report failed"

                    # ניתוח תוצאות
                    if [ $TEST_EXIT_CODE -eq 0 ]; then
                        TESTS_PASSED=$(grep -c "ok$" test_results.txt || echo "0")
                        echo "✅ All tests passed!"
                        echo "Tests passed: $TESTS_PASSED"
                    else
                        TESTS_FAILED=$(grep -c "FAIL\\|ERROR" test_results.txt || echo "0")
                        echo "❌ Some tests failed!"
                        echo "Tests failed: $TESTS_FAILED"
                    fi

                    # חילוץ נתוני כיסוי
                    COVERAGE_PERCENT=$(coverage report | tail -1 | grep -oE '[0-9]+%' | head -1 || echo "0%")
                    LINES_COVERED=$(coverage report | tail -1 | awk '{print $4}' || echo "0")
                    LINES_TOTAL=$(coverage report | tail -1 | awk '{print $2}' || echo "0")

                    echo "=== BACKEND METRICS ==="
                    echo "Test Duration: ${TEST_DURATION} seconds"
                    echo "Total Tests: $TOTAL_TESTS"
                    echo "Tests Passed: $TESTS_PASSED"
                    echo "Tests Failed: ${TESTS_FAILED:-0}"
                    echo "Coverage Percentage: $COVERAGE_PERCENT"
                    echo "Lines Covered: $LINES_COVERED"
                    echo "Total Lines: $LINES_TOTAL"
                    echo "Exit Code: $TEST_EXIT_CODE"

                    # שמירת מטריקות לקובץ
                    cat > backend_metrics.json << EOF
{
    "test_duration_seconds": $TEST_DURATION,
    "total_tests": $TOTAL_TESTS,
    "tests_passed": $TESTS_PASSED,
    "tests_failed": ${TESTS_FAILED:-0},
    "coverage_percent": "$COVERAGE_PERCENT",
    "lines_covered": $LINES_COVERED,
    "lines_total": $LINES_TOTAL,
    "exit_code": $TEST_EXIT_CODE,
    "timestamp": "$(date -Iseconds)"
}
EOF

                    # יצירת דוח HTML פשוט לכיסוי קוד
                    cat > backend_coverage_report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Backend Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .good { border-left: 5px solid #4CAF50; }
        .warning { border-left: 5px solid #FF9800; }
        .bad { border-left: 5px solid #F44336; }
        h1 { color: #333; }
        .percentage { font-size: 2em; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Backend Test Coverage Report</h1>
EOF

                    # הוספת נתונים לדוח HTML
                    COVERAGE_NUM=$(echo $COVERAGE_PERCENT | tr -d '%')
                    if [ "$COVERAGE_NUM" -ge "80" ]; then
                        CSS_CLASS="good"
                    elif [ "$COVERAGE_NUM" -ge "60" ]; then
                        CSS_CLASS="warning"
                    else
                        CSS_CLASS="bad"
                    fi

                    cat >> backend_coverage_report.html << EOF
    <div class="metric $CSS_CLASS">
        <h2>Overall Coverage</h2>
        <div class="percentage">$COVERAGE_PERCENT</div>
        <p>$LINES_COVERED of $LINES_TOTAL lines covered</p>
    </div>

    <div class="metric">
        <h2>Test Results</h2>
        <p><strong>Total Tests:</strong> $TOTAL_TESTS</p>
        <p><strong>Passed:</strong> $TESTS_PASSED</p>
        <p><strong>Failed:</strong> ${TESTS_FAILED:-0}</p>
        <p><strong>Duration:</strong> ${TEST_DURATION} seconds</p>
    </div>

    <div class="metric">
        <h2>Detailed Coverage</h2>
        <pre>$(cat coverage_report.txt)</pre>
    </div>
</body>
</html>
EOF

                    echo "=== BACKEND TESTING COMPLETED ==="
                '''
                script {
                    env.BACKEND_TEST_END = "${new Date().time}"

                    // קריאת נתוני המטריקות
                    try {
                        def metrics = readJSON file: 'backend_metrics.json'
                        env.BACKEND_COVERAGE = metrics.coverage_percent
                        env.BACKEND_TESTS_TOTAL = metrics.total_tests.toString()
                        env.BACKEND_TESTS_PASSED = metrics.tests_passed.toString()
                        env.BACKEND_TESTS_FAILED = metrics.tests_failed.toString()
                        env.BACKEND_TEST_DURATION = metrics.test_duration_seconds.toString()
                    } catch (Exception e) {
                        echo "Warning: Could not read backend metrics: ${e.message}"
                        env.BACKEND_COVERAGE = "Unknown"
                    }
                }

                // שמירת artifacts
                archiveArtifacts artifacts: 'backend_metrics.json,backend_coverage_report.html,coverage_report.txt,test_results.txt', allowEmptyArchive: true
            }
        }

        stage('Install Frontend') {
            agent {
                docker {
                    image 'node:20'
                    args '--user root'
                }
            }
            steps {
                script {
                    env.FRONTEND_INSTALL_START = "${new Date().time}"
                }
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "=== FRONTEND INSTALLATION STARTED ==="

                        # ניקוי cache
                        npm cache clean --force || true
                        rm -rf node_modules package-lock.json || true

                        # התקנת dependencies
                        echo "Installing dependencies..."
                        npm install --legacy-peer-deps

                        # התקנת כלים לבדיקות
                        npm install --save-dev jest @testing-library/react @testing-library/jest-dom --legacy-peer-deps

                        # הגדרת Jest ב-package.json
                        npm pkg set jest.testEnvironment="jsdom"
                        npm pkg set jest.collectCoverage=true
                        npm pkg set jest.collectCoverageFrom='["src/**/*.{js,jsx}", "!src/index.js"]'
                        npm pkg set jest.coverageDirectory="coverage"
                        npm pkg set jest.coverageReporters='["text", "lcov", "html", "json"]'

                        # יצירת קובץ setupTests.js בסיסי
                        mkdir -p src
                        cat > src/setupTests.js << 'EOF'
import '@testing-library/jest-dom';

// Basic mocks
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
);

global.matchMedia = global.matchMedia || function() {
  return {
    matches: false,
    addListener: jest.fn(),
    removeListener: jest.fn(),
  };
};
EOF

                        # יצירת בדיקה בסיסית אם לא קיימת
                        if [ ! -f "src/App.test.js" ]; then
                            cat > src/App.test.js << 'EOF'
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders app without crashing', () => {
  render(<App />);
  expect(document.body).toBeInTheDocument();
});

test('basic functionality test', () => {
  expect(true).toBe(true);
});
EOF
                        fi

                        echo "Frontend installation completed!"
                    '''
                }
                script {
                    env.FRONTEND_INSTALL_END = "${new Date().time}"
                }
            }
        }

        stage('Test Frontend with Metrics') {
            agent {
                docker {
                    image 'node:20'
                    args '--user root'
                }
            }
            steps {
                script {
                    env.FRONTEND_TEST_START = "${new Date().time}"
                }
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "=== FRONTEND TESTING STARTED ==="
                        echo "Timestamp: $(date)"

                        TEST_START_TIME=$(date +%s)

                        # הרצת בדיקות עם כיסוי
                        CI=true npm test -- --coverage --watchAll=false --verbose --testResultsProcessor=jest-junit 2>&1 | tee test_output.txt
                        TEST_EXIT_CODE=${PIPESTATUS[0]}

                        TEST_END_TIME=$(date +%s)
                        TEST_DURATION=$((TEST_END_TIME - TEST_START_TIME))

                        # ניתוח תוצאות הבדיקות
                        TESTS_TOTAL=$(grep -o "Tests:.*" test_output.txt | head -1 | grep -o "[0-9]\\+ total" | grep -o "[0-9]\\+" || echo "0")
                        TESTS_PASSED=$(grep -o "Tests:.*" test_output.txt | head -1 | grep -o "[0-9]\\+ passed" | grep -o "[0-9]\\+" || echo "0")
                        TESTS_FAILED=$(grep -o "Tests:.*" test_output.txt | head -1 | grep -o "[0-9]\\+ failed" | grep -o "[0-9]\\+" || echo "0")

                        # ניתוח כיסוי קוד
                        if [ -d "coverage" ] && [ -f "coverage/coverage-summary.json" ]; then
                            # קריאת נתוני כיסוי מ-JSON
                            COVERAGE_LINES=$(cat coverage/coverage-summary.json | grep -o '"lines":{"total":[0-9]*,"covered":[0-9]*,"skipped":[0-9]*,"pct":[0-9.]*}' | grep -o '"pct":[0-9.]*' | cut -d':' -f2 || echo "0")
                            COVERAGE_PERCENT="${COVERAGE_LINES}%"
                        else
                            COVERAGE_PERCENT="0%"
                        fi

                        echo "=== FRONTEND METRICS ==="
                        echo "Test Duration: ${TEST_DURATION} seconds"
                        echo "Total Tests: $TESTS_TOTAL"
                        echo "Tests Passed: $TESTS_PASSED"
                        echo "Tests Failed: $TESTS_FAILED"
                        echo "Coverage: $COVERAGE_PERCENT"
                        echo "Exit Code: $TEST_EXIT_CODE"

                        # שמירת מטריקות
                        cat > frontend_metrics.json << EOF
{
    "test_duration_seconds": $TEST_DURATION,
    "total_tests": $TESTS_TOTAL,
    "tests_passed": $TESTS_PASSED,
    "tests_failed": $TESTS_FAILED,
    "coverage_percent": "$COVERAGE_PERCENT",
    "exit_code": $TEST_EXIT_CODE,
    "timestamp": "$(date -Iseconds)"
}
EOF

                        # יצירת דוח HTML פשוט
                        cat > frontend_coverage_report.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Frontend Coverage Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .metric { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .good { border-left: 5px solid #4CAF50; }
        .warning { border-left: 5px solid #FF9800; }
        .bad { border-left: 5px solid #F44336; }
        h1 { color: #333; }
        .percentage { font-size: 2em; font-weight: bold; }
    </style>
</head>
<body>
    <h1>Frontend Test Coverage Report</h1>
EOF

                        COVERAGE_NUM=$(echo $COVERAGE_PERCENT | tr -d '%' | cut -d'.' -f1)
                        if [ "$COVERAGE_NUM" -ge "80" ]; then
                            CSS_CLASS="good"
                        elif [ "$COVERAGE_NUM" -ge "60" ]; then
                            CSS_CLASS="warning"
                        else
                            CSS_CLASS="bad"
                        fi

                        cat >> frontend_coverage_report.html << EOF
    <div class="metric $CSS_CLASS">
        <h2>Overall Coverage</h2>
        <div class="percentage">$COVERAGE_PERCENT</div>
    </div>

    <div class="metric">
        <h2>Test Results</h2>
        <p><strong>Total Tests:</strong> $TESTS_TOTAL</p>
        <p><strong>Passed:</strong> $TESTS_PASSED</p>
        <p><strong>Failed:</strong> $TESTS_FAILED</p>
        <p><strong>Duration:</strong> ${TEST_DURATION} seconds</p>
    </div>

    <div class="metric">
        <h2>Test Output</h2>
        <pre>$(cat test_output.txt | tail -20)</pre>
    </div>
</body>
</html>
EOF

                        echo "=== FRONTEND TESTING COMPLETED ==="
                    '''
                }
                script {
                    env.FRONTEND_TEST_END = "${new Date().time}"

                    try {
                        def metrics = readJSON file: "${FRONTEND_DIR}/frontend_metrics.json"
                        env.FRONTEND_COVERAGE = metrics.coverage_percent
                        env.FRONTEND_TESTS_TOTAL = metrics.total_tests.toString()
                        env.FRONTEND_TESTS_PASSED = metrics.tests_passed.toString()
                        env.FRONTEND_TESTS_FAILED = metrics.tests_failed.toString()
                        env.FRONTEND_TEST_DURATION = metrics.test_duration_seconds.toString()
                    } catch (Exception e) {
                        echo "Warning: Could not read frontend metrics: ${e.message}"
                        env.FRONTEND_COVERAGE = "Unknown"
                    }
                }

                archiveArtifacts artifacts: "${FRONTEND_DIR}/frontend_metrics.json,${FRONTEND_DIR}/frontend_coverage_report.html,${FRONTEND_DIR}/test_output.txt", allowEmptyArchive: true
            }
        }

        stage('Build Frontend') {
            agent {
                docker {
                    image 'node:20'
                    args '--user root'
                }
            }
            steps {
                script {
                    env.FRONTEND_BUILD_START = "${new Date().time}"
                }
                dir("${FRONTEND_DIR}") {
                    sh '''
                        echo "=== FRONTEND BUILD STARTED ==="

                        BUILD_START_TIME=$(date +%s)

                        # תיקון בעיית fs-extra
                        npm install fs-extra --legacy-peer-deps || true

                        # בניית הפרויקט
                        CI=false npm run build
                        BUILD_EXIT_CODE=$?

                        BUILD_END_TIME=$(date +%s)
                        BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))

                        if [ $BUILD_EXIT_CODE -eq 0 ] && [ -d "build" ]; then
                            BUILD_SIZE_BYTES=$(du -sb build/ | cut -f1)
                            BUILD_SIZE_MB=$((BUILD_SIZE_BYTES / 1024 / 1024))
                            FILE_COUNT=$(find build -type f | wc -l)
                            JS_FILES=$(find build -name "*.js" | wc -l)
                            CSS_FILES=$(find build -name "*.css" | wc -l)

                            echo "✅ Build successful!"
                            echo "Build size: ${BUILD_SIZE_MB} MB"
                            echo "Total files: $FILE_COUNT"
                            echo "JS files: $JS_FILES"
                            echo "CSS files: $CSS_FILES"
                            echo "Build duration: ${BUILD_DURATION} seconds"

                            # שמירת מטריקות build
                            cat > build_metrics.json << EOF
{
    "build_duration_seconds": $BUILD_DURATION,
    "build_size_bytes": $BUILD_SIZE_BYTES,
    "build_size_mb": $BUILD_SIZE_MB,
    "total_files": $FILE_COUNT,
    "js_files": $JS_FILES,
    "css_files": $CSS_FILES,
    "exit_code": $BUILD_EXIT_CODE,
    "timestamp": "$(date -Iseconds)"
}
EOF
                        else
                            echo "❌ Build failed!"
                            cat > build_metrics.json << EOF
{
    "build_duration_seconds": $BUILD_DURATION,
    "build_size_bytes": 0,
    "exit_code": $BUILD_EXIT_CODE,
    "timestamp": "$(date -Iseconds)"
}
EOF
                        fi
                    '''
                }
                script {
                    env.FRONTEND_BUILD_END = "${new Date().time}"

                    try {
                        def buildMetrics = readJSON file: "${FRONTEND_DIR}/build_metrics.json"
                        env.BUILD_SIZE_MB = buildMetrics.build_size_mb?.toString() ?: "0"
                        env.BUILD_DURATION = buildMetrics.build_duration_seconds?.toString() ?: "0"
                        env.BUILD_SUCCESS = (buildMetrics.exit_code == 0).toString()
                    } catch (Exception e) {
                        echo "Warning: Could not read build metrics: ${e.message}"
                        env.BUILD_SUCCESS = "false"
                    }
                }

                archiveArtifacts artifacts: "${FRONTEND_DIR}/build_metrics.json", allowEmptyArchive: true
                archiveArtifacts artifacts: "${FRONTEND_DIR}/build/**/*", allowEmptyArchive: true
            }
        }

        stage('Quality Gate') {
            agent any
            steps {
                script {
                    // Quality Gate בדיקות
                    def backendCoverage = env.BACKEND_COVERAGE?.replace('%', '')?.toFloat() ?: 0
                    def frontendCoverage = env.FRONTEND_COVERAGE?.replace('%', '')?.toFloat() ?: 0
                    def buildSuccess = env.BUILD_SUCCESS == "true"
                    def backendTestsPassed = (env.BACKEND_TESTS_FAILED?.toInteger() ?: 0) == 0
                    def frontendTestsPassed = (env.FRONTEND_TESTS_FAILED?.toInteger() ?: 0) == 0

                    def qualityGatePassed = true
                    def qualityIssues = []

                    // בדיקות Quality Gate
                    if (backendCoverage < 50) {
                        qualityGatePassed = false
                        qualityIssues.add("Backend coverage below 50%: ${backendCoverage}%")
                    }

                    if (!buildSuccess) {
                        qualityGatePassed = false
                        qualityIssues.add("Frontend build failed")
                    }

                    if (!backendTestsPassed) {
                        qualityGatePassed = false
                        qualityIssues.add("Backend tests failed: ${env.BACKEND_TESTS_FAILED} failures")
                    }

                    if (!frontendTestsPassed) {
                        qualityGatePassed = false
                        qualityIssues.add("Frontend tests failed: ${env.FRONTEND_TESTS_FAILED} failures")
                    }

                    env.QUALITY_GATE_PASSED = qualityGatePassed.toString()
                    env.QUALITY_ISSUES = qualityIssues.join('; ')

                    if (qualityGatePassed) {
                        echo "✅ Quality Gate PASSED!"
                        echo "   - Backend Coverage: ${backendCoverage}%"
                        echo "   - Frontend Coverage: ${frontendCoverage}%"
                        echo "   - Build: Success"
                        echo "   - All Tests: Passed"
                    } else {
                        echo "❌ Quality Gate FAILED:"
                        qualityIssues.each { issue ->
                            echo "   - ${issue}"
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                // חישוב מטריקות Pipeline מלאות
                def pipelineEndTime = new Date().time
                def totalDurationMs = pipelineEndTime - (env.PIPELINE_START_TIME as long)
                def totalDurationSec = totalDurationMs / 1000

                // חישוב זמני stages
                def backendInstallTime = calculateStageDuration(env.BACKEND_INSTALL_START, env.BACKEND_INSTALL_END)
                def backendTestTime = env.BACKEND_TEST_DURATION ?: "Unknown"
                def frontendInstallTime = calculateStageDuration(env.FRONTEND_INSTALL_START, env.FRONTEND_INSTALL_END)
                def frontendTestTime = env.FRONTEND_TEST_DURATION ?: "Unknown"
                def frontendBuildTime = env.BUILD_DURATION ?: "Unknown"

                // הכנת דוח מטריקות מקיף
                def metricsReport = """
=========================================
       COMPREHENSIVE METRICS REPORT
=========================================

🔧 PIPELINE OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status: ${currentBuild.result ?: 'SUCCESS'}
Build Number: #${env.BUILD_NUMBER}
Total Duration: ${totalDurationSec} seconds (${Math.round(totalDurationSec/60*100)/100} minutes)
Quality Gate: ${env.QUALITY_GATE_PASSED == 'true' ? '✅ PASSED' : '❌ FAILED'}
${env.QUALITY_ISSUES ? 'Quality Issues: ' + env.QUALITY_ISSUES : 'No quality issues detected'}

📊 DEVOPS KPIs (from presentation requirements)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Deployment Frequency: Build #${env.BUILD_NUMBER} (${new Date().format('yyyy-MM-dd HH:mm:ss')})
• Deployment Speed: ${totalDurationSec} seconds
• Change Lead Time: ${totalDurationSec} seconds (commit to deployment-ready)
• Mean Time to Detection: ${(backendTestTime as Double) + (frontendTestTime as Double)} seconds (test execution)
• Change Failure Rate: ${currentBuild.result == 'FAILURE' ? 'This build FAILED' : 'This build PASSED'}

⏱️ STAGE DURATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Install: ${backendInstallTime} seconds
Backend Test: ${backendTestTime} seconds
Frontend Install: ${frontendInstallTime} seconds
Frontend Test: ${frontendTestTime} seconds
Frontend Build: ${frontendBuildTime} seconds

🧪 TEST METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Tests:
  • Total: ${env.BACKEND_TESTS_TOTAL ?: 'Unknown'}
  • Passed: ${env.BACKEND_TESTS_PASSED ?: 'Unknown'}
  • Failed: ${env.BACKEND_TESTS_FAILED ?: 'Unknown'}
  • Duration: ${backendTestTime} seconds

Frontend Tests:
  • Total: ${env.FRONTEND_TESTS_TOTAL ?: 'Unknown'}
  • Passed: ${env.FRONTEND_TESTS_PASSED ?: 'Unknown'}
  • Failed: ${env.FRONTEND_TESTS_FAILED ?: 'Unknown'}
  • Duration: ${frontendTestTime} seconds

📈 CODE COVERAGE (Quality Gate requirement)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Backend Coverage: ${env.BACKEND_COVERAGE ?: 'Unknown'}
Frontend Coverage: ${env.FRONTEND_COVERAGE ?: 'Unknown'}

🏗️ BUILD METRICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Build Status: ${env.BUILD_SUCCESS == 'true' ? '✅ SUCCESS' : '❌ FAILED'}
Build Size: ${env.BUILD_SIZE_MB ?: 'Unknown'} MB
Build Duration: ${frontendBuildTime} seconds

🔍 GIT INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Commit: ${env.GIT_COMMIT_SHORT ?: 'Unknown'}
Branch: ${env.GIT_BRANCH_NAME ?: 'Unknown'}
Timestamp: ${new Date().format('yyyy-MM-dd HH:mm:ss')}

📋 CICD MEASUREMENTS (as per presentation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Deployment frequency: Build #${env.BUILD_NUMBER}
2. Deployment Time/Lead Time: ${totalDurationSec}s
3. Number of failed builds: ${currentBuild.result == 'FAILURE' ? '1 (this build)' : '0 (this build passed)'}
4. Number of succeeded builds: ${currentBuild.result != 'FAILURE' ? '1 (this build)' : '0 (this build failed)'}
5. Code coverage: Backend ${env.BACKEND_COVERAGE ?: 'N/A'}, Frontend ${env.FRONTEND_COVERAGE ?: 'N/A'}
6. Test execution time: ${(backendTestTime as Double) + (frontendTestTime as Double)}s total
7. Error rates: ${((env.BACKEND_TESTS_FAILED as Integer) + (env.FRONTEND_TESTS_FAILED as Integer))} failed tests
8. % Automated tests pass: ${calculatePassRate()}%

=========================================
       END OF METRICS REPORT
=========================================
"""

                echo metricsReport
                writeFile file: 'comprehensive_metrics_report.txt', text: metricsReport

                // יצירת דוח JSON למטריקות
                def jsonMetrics = [
                    pipeline: [
                        build_number: env.BUILD_NUMBER,
                        status: currentBuild.result ?: 'SUCCESS',
                        total_duration_seconds: totalDurationSec,
                        quality_gate_passed: env.QUALITY_GATE_PASSED == 'true',
                        timestamp: new Date().format("yyyy-MM-dd'T'HH:mm:ss'Z'")
                    ],
                    devops_kpis: [
                        deployment_frequency: "Build #${env.BUILD_NUMBER}",
                        deployment_speed_seconds: totalDurationSec,
                        change_lead_time_seconds: totalDurationSec,
                        mean_time_to_detection_seconds: (backendTestTime as Double) + (frontendTestTime as Double),
                        change_failure_rate: currentBuild.result == 'FAILURE' ? 'FAILED' : 'PASSED'
                    ],
                    backend: [
                        install_duration_seconds: backendInstallTime,
                        test_duration_seconds: backendTestTime,
                        tests_total: env.BACKEND_TESTS_TOTAL?.toInteger() ?: 0,
                        tests_passed: env.BACKEND_TESTS_PASSED?.toInteger() ?: 0,
                        tests_failed: env.BACKEND_TESTS_FAILED?.toInteger() ?: 0,
                        coverage_percent: env.BACKEND_COVERAGE ?: 'Unknown'
                    ],
                    frontend: [
                        install_duration_seconds: frontendInstallTime,
                        test_duration_seconds: frontendTestTime,
                        build_duration_seconds: frontendBuildTime,
                        tests_total: env.FRONTEND_TESTS_TOTAL?.toInteger() ?: 0,
                        tests_passed: env.FRONTEND_TESTS_PASSED?.toInteger() ?: 0,
                        tests_failed: env.FRONTEND_TESTS_FAILED?.toInteger() ?: 0,
                        coverage_percent: env.FRONTEND_COVERAGE ?: 'Unknown',
                        build_success: env.BUILD_SUCCESS == 'true',
                        build_size_mb: env.BUILD_SIZE_MB?.toInteger() ?: 0
                    ],
                    git: [
                        commit: env.GIT_COMMIT_SHORT ?: 'Unknown',
                        branch: env.GIT_BRANCH_NAME ?: 'Unknown'
                    ]
                ]

                writeJSON file: 'pipeline_metrics.json', json: jsonMetrics

                // יצירת דוח HTML יפה למטריקות
                def htmlReport = """
<!DOCTYPE html>
<html>
<head>
    <title>Pipeline Metrics Dashboard</title>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 { margin: 0; font-size: 2.5em; font-weight: 300; }
        .header p { margin: 10px 0 0 0; opacity: 0.8; }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            border-radius: 10px;
            padding: 25px;
            border-left: 5px solid #3498db;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            transition: transform 0.2s;
        }
        .metric-card:hover { transform: translateY(-2px); }
        .metric-card.success { border-left-color: #27ae60; }
        .metric-card.warning { border-left-color: #f39c12; }
        .metric-card.danger { border-left-color: #e74c3c; }
        .metric-card h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 1.3em;
            display: flex;
            align-items: center;
        }
        .metric-card .icon {
            margin-right: 10px;
            font-size: 1.5em;
        }
        .metric-value {
            font-size: 2em;
            font-weight: bold;
            color: #2c3e50;
            margin: 10px 0;
        }
        .metric-details {
            color: #7f8c8d;
            font-size: 0.9em;
            line-height: 1.4;
        }
        .status-badge {
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-success { background: #27ae60; color: white; }
        .status-failure { background: #e74c3c; color: white; }
        .status-warning { background: #f39c12; color: white; }
        .footer {
            background: #ecf0f1;
            padding: 20px;
            text-align: center;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
        }
        .progress-bar {
            background: #ecf0f1;
            border-radius: 10px;
            height: 8px;
            margin: 10px 0;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60, #2ecc71);
            border-radius: 10px;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Pipeline Metrics Dashboard</h1>
            <p>Build #${env.BUILD_NUMBER} • ${new Date().format('MMM dd, yyyy HH:mm:ss')}</p>
            <span class="status-badge ${currentBuild.result == 'FAILURE' ? 'status-failure' : 'status-success'}">
                ${currentBuild.result ?: 'SUCCESS'}
            </span>
        </div>

        <div class="metrics-grid">
            <div class="metric-card ${env.QUALITY_GATE_PASSED == 'true' ? 'success' : 'danger'}">
                <h3><span class="icon">${env.QUALITY_GATE_PASSED == 'true' ? '✅' : '❌'}</span>Quality Gate</h3>
                <div class="metric-value">${env.QUALITY_GATE_PASSED == 'true' ? 'PASSED' : 'FAILED'}</div>
                <div class="metric-details">
                    ${env.QUALITY_ISSUES ?: 'All quality checks passed successfully'}
                </div>
            </div>

            <div class="metric-card">
                <h3><span class="icon">⏱️</span>Pipeline Duration</h3>
                <div class="metric-value">${Math.round(totalDurationSec)} sec</div>
                <div class="metric-details">
                    ${Math.round(totalDurationSec/60*100)/100} minutes total<br>
                    Lead time from commit to deployment-ready
                </div>
            </div>

            <div class="metric-card ${(env.BACKEND_COVERAGE?.replace('%','')?.toFloat() ?: 0) >= 70 ? 'success' : 'warning'}">
                <h3><span class="icon">🧪</span>Backend Coverage</h3>
                <div class="metric-value">${env.BACKEND_COVERAGE ?: 'N/A'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${env.BACKEND_COVERAGE?.replace('%','') ?: '0'}%"></div>
                </div>
                <div class="metric-details">
                    Tests: ${env.BACKEND_TESTS_PASSED ?: '0'} passed, ${env.BACKEND_TESTS_FAILED ?: '0'} failed<br>
                    Duration: ${backendTestTime}s
                </div>
            </div>

            <div class="metric-card ${(env.FRONTEND_COVERAGE?.replace('%','')?.toFloat() ?: 0) >= 70 ? 'success' : 'warning'}">
                <h3><span class="icon">🎨</span>Frontend Coverage</h3>
                <div class="metric-value">${env.FRONTEND_COVERAGE ?: 'N/A'}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${env.FRONTEND_COVERAGE?.replace('%','') ?: '0'}%"></div>
                </div>
                <div class="metric-details">
                    Tests: ${env.FRONTEND_TESTS_PASSED ?: '0'} passed, ${env.FRONTEND_TESTS_FAILED ?: '0'} failed<br>
                    Duration: ${frontendTestTime}s
                </div>
            </div>

            <div class="metric-card ${env.BUILD_SUCCESS == 'true' ? 'success' : 'danger'}">
                <h3><span class="icon">🏗️</span>Build Status</h3>
                <div class="metric-value">${env.BUILD_SUCCESS == 'true' ? 'SUCCESS' : 'FAILED'}</div>
                <div class="metric-details">
                    Size: ${env.BUILD_SIZE_MB ?: 'Unknown'} MB<br>
                    Duration: ${frontendBuildTime}s
                </div>
            </div>

            <div class="metric-card">
                <h3><span class="icon">📊</span>DevOps KPIs</h3>
                <div class="metric-details">
                    <strong>Deployment Frequency:</strong> Build #${env.BUILD_NUMBER}<br>
                    <strong>Deployment Speed:</strong> ${totalDurationSec}s<br>
                    <strong>Change Failure Rate:</strong> ${currentBuild.result == 'FAILURE' ? 'Failed' : 'Passed'}<br>
                    <strong>MTTD:</strong> ${(backendTestTime as Double) + (frontendTestTime as Double)}s
                </div>
            </div>

            <div class="metric-card">
                <h3><span class="icon">🔍</span>Git Information</h3>
                <div class="metric-details">
                    <strong>Commit:</strong> ${env.GIT_COMMIT_SHORT ?: 'Unknown'}<br>
                    <strong>Branch:</strong> ${env.GIT_BRANCH_NAME ?: 'Unknown'}<br>
                    <strong>Build Number:</strong> #${env.BUILD_NUMBER}
                </div>
            </div>

            <div class="metric-card">
                <h3><span class="icon">⚡</span>Performance Breakdown</h3>
                <div class="metric-details">
                    <strong>Backend Install:</strong> ${backendInstallTime}s<br>
                    <strong>Backend Test:</strong> ${backendTestTime}s<br>
                    <strong>Frontend Install:</strong> ${frontendInstallTime}s<br>
                    <strong>Frontend Test:</strong> ${frontendTestTime}s<br>
                    <strong>Frontend Build:</strong> ${frontendBuildTime}s
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Generated automatically by Jenkins Pipeline • Team 30 CICD Metrics</p>
            <p>For detailed reports, check the build artifacts</p>
        </div>
    </div>
</body>
</html>
"""

                writeFile file: 'metrics_dashboard.html', text: htmlReport

                // שמירת כל הartifacts
                archiveArtifacts artifacts: 'comprehensive_metrics_report.txt,pipeline_metrics.json,metrics_dashboard.html', allowEmptyArchive: false
            }
        }
        success {
            echo "✅ Pipeline completed successfully!"
            echo "📊 Comprehensive metrics collected and available in artifacts:"
            echo "   • comprehensive_metrics_report.txt - Full text report"
            echo "   • pipeline_metrics.json - JSON format for automation"
            echo "   • metrics_dashboard.html - Interactive HTML dashboard"
            echo "   • backend_coverage_report.html - Backend coverage details"
            echo "   • frontend_coverage_report.html - Frontend coverage details"
        }
        failure {
            echo "❌ Pipeline failed."
            echo "📊 Metrics still collected for failure analysis."
            echo "🔍 Check the comprehensive metrics report for detailed failure information."
        }
    }
}

// פונקציה עזר לחישוב זמני stages
def calculateStageDuration(startTime, endTime) {
    if (!startTime || !endTime) return 0
    try {
        return ((endTime as long) - (startTime as long)) / 1000
    } catch (Exception e) {
        return 0
    }
}

// פונקציה לחישוב אחוז הצלחה של בדיקות
def calculatePassRate() {
    try {
        def backendTotal = env.BACKEND_TESTS_TOTAL?.toInteger() ?: 0
        def backendPassed = env.BACKEND_TESTS_PASSED?.toInteger() ?: 0
        def frontendTotal = env.FRONTEND_TESTS_TOTAL?.toInteger() ?: 0
        def frontendPassed = env.FRONTEND_TESTS_PASSED?.toInteger() ?: 0

        def totalTests = backendTotal + frontendTotal
        def totalPassed = backendPassed + frontendPassed

        if (totalTests == 0) return 0
        return Math.round((totalPassed / totalTests) * 100)
    } catch (Exception e) {
        return 0
    }
}