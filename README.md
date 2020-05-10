# Serverless + Amplify + Cognito + ApiGateway solution

This solution is to use only one Express js based lambda to serve both SPA frontend (React) and regular JS REST API backend

The lambda is then exposed though API gateway for users to access

## Work flow

```
sls deploy
```
this will deploy Cognito pool/client and API gateway then generate the `aws-exports.js` file in ./src directory  
`aws-exports.js` is AWS Amplify's config file, it contains the settings for client_id and API gateway URL etc

Then run `npm run build` to build React frontend app and generate artifacts in ./build directly
This step is required becauset it will use the `aws-exports.js` file genereatd in previous step.

That means every time if you rebuild cognito pool or rebuild API Gateway, you need to run `npm run build` to update the `aws-exports.js` change into application

Then run `sls deploy` again to upload the packaged Lambda which also include all files in ./build directory to Lambda

After it's uploaded. run `npm run clear-cache` to clear APIGateway's cache otherwise you might still get cache html/css content.


## Discuss about the technologies we used

  - aws-amplify-serverless-plugin
  - serverless-apigw-binary
  - serverless-plugin-reducer

### aws-amplify-serverless-plugin

This plugin is aws's amplify for serverless plugin, it is used to generate the aws-exports.js file based on the Cognito pools etc.

### serverless-apigw-binary

This is the plugin for apiGateway to serve binary files like pictures, images and videos. We need it to run Express server from a lambda behind ApiGateway

### serverless-plugin-reducer

This plugin helps us to reduce the size of the lambda.
```
package:
  individually: true
  exclude:
    # - node_modules/**
    - amplify/**
    - public/**
    - src/**
    - yarn.lock
```
then for each function, we can specify what files/dirs to include in the upload package

The "package: include xxx " below shows how to include React's build folder to the package
```
functions:
  expressapp:
    handler: lambda.express
    events:
      - http:
          method: ANY 
          path: /{proxy+}
          cors: true
          # authorizer: aws_iam
      - http:
          method: ANY 
          path: /
          cors: true
          # authorizer: aws_iam
    package:
      include:
        - build/**
```

NOTE:

The functions you want to protected by Cognito have to use 'authorizer'

AWS Amplify requires it to use 'aws_iam' type like below  
The lines commented out are from a lot Cognito + ApiGateway solutions articles.  

The typical way is to create a AWS::ApiGateway::Authorizer then Ref it here

But unfortunately, they don't work with Amplify and integration:lambda doesn't work with our {proxy+} type path  
By default, integration type is lambda_proxy which works fine.

The following snippets uses 'authorizer: aws_iam' default (lambda_proxy) integration.  
These settings work well with Amplify and Cognito  
```
functions:
  expressapp:
    handler: lambda.express
    events:
      - http: 
          method: ANY 
          path: /api/{proxy+}
          cors: true
          # integration: lambda  # note: not use lambda, default is lambda_proxy, that works
          # authorizer:
          #   type: COGNITO_USER_POOLS
          #   authorizerId:
          #     Ref: ApiGatewayAuthorizer
          authorizer: aws_iam
```

Another thing worth mentioning is the 'catch-all' route for React (or any kind of SPA - Single Page App)

For example, if you have a ReactRoute /app/about or something, it's not a real folder in backend Express
It's just a http request path that React will parse and render on.  

So we need to catch all non-existing request path then redirect them to /index.html

Refer to these lines in the ./app.js file
```
// Final catch-all route, if 404 then redirect to index.html (How React works)
app.use(function(req, res) {
    // res.send('404: Page not Found', 404);
    res.sendFile('index.html', { root:  './build'});
});
```