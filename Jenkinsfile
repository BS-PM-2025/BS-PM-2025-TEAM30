/*
pipeline {
    agent none

    stages {
        stage('Build') {
            agent {
                docker {
                    image 'python:2-alpine'
                }
            }
            steps {
                sh 'python -m py_compile sources/add2vals.py sources/calc.py || true'
            }
        }

        stage('Test') {
            agent {
                docker {
                    image 'qnib/pytest'
                }
            }
            steps {
                sh 'py.test --verbose --junit-xml test-reports/results.xml sources/test_calc.py || true'
            }
            post {
                always {
                    junit 'test-reports/results.xml'
                }
            }
        }
    }
}
*/
pipeline {
    agent any

    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend-clean'
    }

    stages {
        stage('Install Backend') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                // יוצרים סביבת פייתון וירטואלית בתיקייה backend אבל מתקינים מה-root
                sh '''
                    python -m venv backend/venv
                    ./backend/venv/bin/pip install --upgrade pip
                    ./backend/venv/bin/pip install -r requirements.txt
                '''
            }
        }

        stage('Test Backend') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                dir("${BACKEND_DIR}") {
                    sh '../backend/venv/bin/python manage.py test --verbosity 2'
                }
            }
        }

        stage('Install Frontend') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm install'
                }
            }
        }

        stage('Test Frontend') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir("${FRONTEND_DIR}") {
                    sh 'npm test -- --watchAll=false'
                }
            }
        }
    }
}
