# SQS with DLQ

1. Start localstack
   ```shell
   docker run --rm \
              --name localstack \
              -v /var/run/docker.sock:/var/run/docker.sock \
              -p 8080:8080 \
              -p 4566-4599:4566-4599 \
              localstack/localstack
   ```

2. Create the SQS Queue and Lambda Function

   You can use the AWS CLI (configured to interact with LocalStack) to create your queue and function. Remember to replace the `--endpoint-url` with your LocalStack endpoint (default is http://localhost:4566):

   Create the SQS queue:
   ```shell
   aws --endpoint-url=http://localhost:4566 \
       sqs create-queue \
       --queue-name myDLQ
   ```

3. Package your Lambda function code into a .zip file:
   ```shell
   zip function.zip index.js
   ```

4. Create the Lambda function:
   ```shell
   aws --endpoint-url=http://localhost:4566 \
       lambda create-function \
       --function-name MyLambdaFunction \
       --zip-file fileb://function.zip \
       --handler index.handler \
       --runtime nodejs12.x \
       --role arn:aws:iam::000000000000:role/irrelevant
   ```

5. Add the SQS Trigger to Your Lambda Function:

   You can add the SQS trigger to your function using the create-event-source-mapping command. Here's an example:

   ```shell
   aws --endpoint-url=http://localhost:4566 \
       lambda create-event-source-mapping \
       --function-name MyLambdaFunction \
       --batch-size 10 \
       --event-source arn:aws:sqs:us-east-1:000000000000:myDLQ
   ```
   Note: In LocalStack, you're not charged for the resources you use, so you can use any random AWS account ID (like 000000000000).

6. Test the setup:

   Now you can test your setup by sending messages to your DLQ:

   ```shell
   aws --endpoint-url=http://localhost:4566 sqs send-message \
       --queue-url http://localhost:4566/000000000000/myDLQ \
       --message-body "Hello, World"
   ```

7. Verify the message consumption:

   If your Lambda function logs the message contents to the console, you can check the logs to verify that your function is correctly consuming messages from the DLQ. You can retrieve Lambda logs from LocalStack using the logs command:

   1. List the Log Groups:
      ```shell
      aws --endpoint-url=http://localhost:4566 logs describe-log-groups
      ```
   2. List the Log Streams:
      ```shell
      aws --endpoint-url=http://localhost:4566 logs describe-log-streams --log-group-name /aws/lambda/MyLambdaFunction
      ```
   3. Get the latest log stream for a specific function
      ```shell
      logStreamName=$(aws --endpoint-url=http://localhost:4566 logs describe-log-streams --log-group-name /aws/lambda/MyLambdaFunction --order-by LastEventTime --descending | jq -r '.logStreams[0].logStreamName')
      ```
   4. Get the log events
      ```shell
      aws --endpoint-url=http://localhost:4566 logs get-log-events \
          --log-group-name /aws/lambda/MyLambdaFunction \
          --log-stream-name $logStreamName
      ```
