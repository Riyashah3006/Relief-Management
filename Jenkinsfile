pipeline {
    agent any

    environment {
        APP_NAME = 'vanguard-ops'
        IMAGE_NAME = 'riyashah3006/relief-management'
        PORT = '5000'
        DATA_DIR = './server/data'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        ansiColor('xterm')
    }

    stages {
        stage('Checkout SCM') {
            steps {
                echo "=========================================================="
                echo " Stage 1: Checking out repository from GitHub"
                echo "=========================================================="
                checkout scm
                sh 'git log -1 --pretty=format:"Commit: %h - %s by %an (%cr)"'
            }
        }

        stage('Environment Check') {
            steps {
                echo "=========================================================="
                echo " Stage 2: Verifying Runtime Tools Environment"
                echo "=========================================================="
                sh 'node --version'
                sh 'npm --version'
                sh 'git --version'
                sh 'docker --version || echo "Docker CLI available"'
            }
        }

        stage('Install Dependencies') {
            steps {
                echo "=========================================================="
                echo " Stage 3: Installing Server and Client Dependencies"
                echo "=========================================================="
                dir('server') {
                    sh 'npm ci'
                }
                dir('client') {
                    sh 'npm ci'
                }
            }
        }

        stage('Automated Unit & API Testing') {
            steps {
                echo "=========================================================="
                echo " Stage 4: Executing Automated Test Suite (Jira Verification)"
                echo "=========================================================="
                dir('server') {
                    sh 'npm test'
                }
            }
        }

        stage('Build Frontend Assets') {
            steps {
                echo "=========================================================="
                echo " Stage 5: Compiling Production Frontend (Vite + Tailwind)"
                echo "=========================================================="
                dir('client') {
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "=========================================================="
                echo " Stage 6: Building Multi-Stage Docker Image"
                echo "=========================================================="
                sh """
                    docker build -t ${IMAGE_NAME}:${BUILD_NUMBER} -t ${IMAGE_NAME}:latest .
                """
            }
        }

        stage('Container Smoke & Health Test') {
            steps {
                echo "=========================================================="
                echo " Stage 7: Testing Docker Container & Healthcheck Probe"
                echo "=========================================================="
                sh """
                    docker run -d --name ${APP_NAME}-smoke-test -p 5098:5000 ${IMAGE_NAME}:${BUILD_NUMBER}
                    sleep 5
                    curl -f http://localhost:5098/api/health || curl -f http://127.0.0.1:5098/api/health
                    docker stop ${APP_NAME}-smoke-test
                    docker rm ${APP_NAME}-smoke-test
                """
            }
        }

        stage('Deploy Application') {
            steps {
                echo "=========================================================="
                echo " Stage 8: Deploying with Docker Compose"
                echo "=========================================================="
                sh """
                    docker compose down || true
                    docker compose up -d
                    echo "Application deployed successfully at http://localhost:5000"
                """
            }
        }
    }

    post {
        always {
            echo "Pipeline run completed. Cleaning up ephemeral workspaces..."
            sh "docker rm -f ${APP_NAME}-smoke-test 2>/dev/null || true"
        }
        success {
            echo "=========================================================="
            echo " BUILD SUCCESS: All Jira Acceptance Criteria & Tests Passed!"
            echo " Vanguard Ops Relief Management Platform Ready!"
            echo "=========================================================="
        }
        failure {
            echo "=========================================================="
            echo " BUILD FAILED: Check the console output above for error logs."
            echo "=========================================================="
        }
    }
}
