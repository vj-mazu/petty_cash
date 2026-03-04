// Browser compatibility utilities for PDF export

export const getBrowserInfo = () => {
  const userAgent = navigator.userAgent;
  const vendor = (navigator as any).vendor || '';
  const isChrome = /Chrome/.test(userAgent) && /Google Inc/.test(vendor);
  const isFirefox = /Firefox/.test(userAgent);
  const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
  const isEdge = /Edg/.test(userAgent);
  const isIE = /MSIE|Trident/.test(userAgent);
  
  return {
    userAgent,
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIE,
    supportsDownload: 'download' in document.createElement('a'),
    supportsBlob: typeof Blob !== 'undefined',
    supportsURL: typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function'
  };
};

export const checkPDFSupport = () => {
  const browser = getBrowserInfo();
  const issues = [];
  
  if (!browser.supportsDownload) {
    issues.push('Browser does not support download attribute');
  }
  
  if (!browser.supportsBlob) {
    issues.push('Browser does not support Blob API');
  }
  
  if (!browser.supportsURL) {
    issues.push('Browser does not support URL.createObjectURL');
  }
  
  if (browser.isIE) {
    issues.push('Internet Explorer has limited PDF support');
  }
  
  return {
    supported: issues.length === 0,
    issues,
    browser: browser
  };
};

export const downloadFile = (blob: Blob, filename: string): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const browser = getBrowserInfo();
      console.log('Attempting download with browser info:', browser);
      
      // Method 1: Modern browsers with download attribute
      if (browser.supportsDownload && browser.supportsURL) {
        console.log('Using modern download method');
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          console.log('Download completed successfully');
          resolve(true);
        }, 100);
        return;
      }
      
      // Method 2: Fallback for older browsers
      if (browser.isIE) {
        console.log('Using IE fallback method');
        // IE specific method
        if ((window.navigator as any).msSaveBlob) {
          (window.navigator as any).msSaveBlob(blob, filename);
          resolve(true);
          return;
        }
      }
      
      // Method 3: Open in new window as last resort
      console.log('Using data URI fallback method');
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const newWindow = window.open();
        if (newWindow) {
          newWindow.document.write(`
            <html>
              <head><title>${filename}</title></head>
              <body style="margin:0;">
                <iframe src="${dataUrl}" width="100%" height="100%" style="border:none;"></iframe>
                <div style="text-align:center; padding:10px;">
                  <a href="${dataUrl}" download="${filename}">Download ${filename}</a>
                </div>
              </body>
            </html>
          `);
          resolve(true);
        } else {
          console.error('Could not open new window for PDF display');
          resolve(false);
        }
      };
      reader.onerror = () => {
        console.error('FileReader failed to read blob');
        resolve(false);
      };
      reader.readAsDataURL(blob);
      
    } catch (error) {
      console.error('Download failed:', error);
      resolve(false);
    }
  });
};

export const showBrowserWarning = () => {
  const support = checkPDFSupport();
  
  if (!support.supported) {
    console.warn('PDF export may not work properly in this browser:', support.issues);
    return `PDF export may have issues in your browser: ${support.issues.join(', ')}. Please try using Chrome, Firefox, or Edge for best results.`;
  }
  
  return null;
};