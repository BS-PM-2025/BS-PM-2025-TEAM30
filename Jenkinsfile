pipeline {
    agent any

    environment {
        VENV_PATH = 'venv'
        FRONTEND_DIR = 'frontend-clean'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Backend') {
            agent {
                docker {
                    image 'python:3.12'
                }
            }
            steps {
                sh '''
                    python -m venv ${VENV_PATH}
                    . ${VENV_PATH}/bin/activate
                    pip install --upgrade pip
                    pip install -r requirements.txt
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
        sh '''
             . ${VENV_PATH}/bin/activate

            # Clean up any existing test database
            echo "Attempting to clean up test database..."
            python -c "from psycopg2 import connect; conn = connect(dbname='postgres', user='postgres', host='db', password='password'); conn.autocommit = True; cur = conn.cursor(); cur.execute('DROP DATABASE IF EXISTS test_postgres;'); conn.close()" || true

            echo "Running migrations for Django built-in apps..."
            python manage.py migrate auth --noinput
            python manage.py migrate contenttypes --noinput
            python manage.py migrate admin --noinput
            python manage.py migrate sessions --noinput

            echo "Running makemigrations for custom apps..."
            python manage.py makemigrations --noinput

            echo "Applying all migrations..."
            python manage.py migrate --noinput

            echo "Running tests with a clean database..."
            python manage.py test --verbosity 2 --noinput --keepd
        '''
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
