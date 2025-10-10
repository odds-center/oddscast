import React, { useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { ThemedText } from '@/components/ThemedText';
import { GOLD_THEME } from '@/constants/theme';

interface TossPaymentWidgetProps {
  orderId: string;
  orderName: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  onSuccess: (data: any) => void;
  onFail: (error: any) => void;
  onCancel: () => void;
}

/**
 * Toss Payments 위젯
 * TODO: 실제 Toss Payments 클라이언트 키 설정 필요
 */
export function TossPaymentWidget({
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  onSuccess,
  onFail,
  onCancel,
}: TossPaymentWidgetProps) {
  const webViewRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);

  // TODO: 환경변수에서 가져오기
  const clientKey = process.env.EXPO_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_DEVELOPMENT';
  const successUrl = 'https://your-domain.com/payment/success';
  const failUrl = 'https://your-domain.com/payment/fail';

  // Toss Payments 결제 위젯 HTML
  const paymentHTML = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <title>Toss Payments</title>
        <script src="https://js.tosspayments.com/v1/payment"></script>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            background: #f8f9fa;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          h1 {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #333;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            padding: 12px 0;
            border-bottom: 1px solid #f0f0f0;
          }
          .info-label { color: #666; font-size: 14px; }
          .info-value { color: #333; font-size: 14px; font-weight: 600; }
          .amount { color: #007AFF; font-size: 24px; font-weight: 700; }
          #payment-button {
            width: 100%;
            background: #007AFF;
            color: white;
            border: none;
            padding: 16px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 700;
            margin-top: 20px;
            cursor: pointer;
          }
          #payment-button:active {
            opacity: 0.8;
          }
          .cancel-button {
            width: 100%;
            background: #f8f9fa;
            color: #666;
            border: 1px solid #dee2e6;
            padding: 16px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            margin-top: 12px;
            cursor: pointer;
          }
          .loading {
            text-align: center;
            padding: 40px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>결제 정보</h1>
          
          <div class="info-row">
            <span class="info-label">상품명</span>
            <span class="info-value">${orderName}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">주문번호</span>
            <span class="info-value">${orderId}</span>
          </div>
          
          <div class="info-row">
            <span class="info-label">결제 금액</span>
            <span class="amount">${amount.toLocaleString()}원</span>
          </div>

          <button id="payment-button">결제하기</button>
          <button class="cancel-button" onclick="handleCancel()">취소</button>
        </div>

        <script>
          const clientKey = "${clientKey}";
          const tossPayments = TossPayments(clientKey);
          
          // 결제 버튼 클릭
          document.getElementById('payment-button').addEventListener('click', function() {
            tossPayments.requestPayment('카드', {
              amount: ${amount},
              orderId: "${orderId}",
              orderName: "${orderName}",
              customerName: "${customerName || '고객'}",
              customerEmail: "${customerEmail || ''}",
              successUrl: "${successUrl}",
              failUrl: "${failUrl}",
            }).catch(function(error) {
              if (error.code === 'USER_CANCEL') {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'CANCEL',
                  data: error
                }));
              } else {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'FAIL',
                  data: error
                }));
              }
            });
          });

          // 취소 버튼
          function handleCancel() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'CANCEL',
              data: null
            }));
          }
        </script>
      </body>
    </html>
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      switch (data.type) {
        case 'SUCCESS':
          onSuccess(data.data);
          break;
        case 'FAIL':
          onFail(data.data);
          break;
        case 'CANCEL':
          onCancel();
          break;
      }
    } catch (error) {
      console.error('WebView message parsing error:', error);
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;

    // 성공 URL
    if (url.includes('/payment/success')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      onSuccess({
        orderId: urlParams.get('orderId'),
        paymentKey: urlParams.get('paymentKey'),
        amount: urlParams.get('amount'),
      });
    }

    // 실패 URL
    if (url.includes('/payment/fail')) {
      const urlParams = new URLSearchParams(url.split('?')[1]);
      onFail({
        code: urlParams.get('code'),
        message: urlParams.get('message'),
      });
    }
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size='large' color={GOLD_THEME.TEXT.SECONDARY} />
          <ThemedText style={styles.loadingText}>결제 창을 불러오는 중...</ThemedText>
        </View>
      )}

      <WebView
        ref={webViewRef}
        source={{ html: paymentHTML }}
        onMessage={handleWebViewMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onLoad={() => setLoading(false)}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        style={styles.webView}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GOLD_THEME.BACKGROUND.PRIMARY,
    zIndex: 1,
  },
  loadingText: {
    marginTop: 16,
    color: GOLD_THEME.TEXT.PRIMARY,
    opacity: 0.7,
  },
});
