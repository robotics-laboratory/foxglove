import cv2
import numpy as np
import matplotlib.pyplot as plt

camera_matrix = np.array([[3.24364167e+03, 0.00000000e+00, 9.38618477e+02],
                          [0.00000000e+00, 3.22055936e+03, 5.82990476e+02],
                          [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]])
distortion_coefficients = np.array([[ 7.10199928e-01, -1.37853150e+01, -1.50329953e-03, -7.73077998e-03, 4.65342208e+01]])

image = cv2.imread('/Users/anastasia/meowmeowX/cv/Photo on 2023-12-5 at 18.39 #3.jpg')
if image is None:
    raise FileNotFoundError("无法加载图片，请检查文件路径和文件完整性")

h, w = image.shape[:2]

new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(camera_matrix, distortion_coefficients, (w, h), 1, (w, h))

undistorted_image = cv2.undistort(image, camera_matrix, distortion_coefficients, None, new_camera_matrix)

# 裁剪图像
# x, y, w, h = roi
# undistorted_image = undistorted_image[y:y+h, x:x+w]

plt.figure(figsize=(10, 5))

plt.subplot(1, 2, 1)
plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
plt.title('Original Image')

plt.subplot(1, 2, 2)
plt.imshow(cv2.cvtColor(undistorted_image, cv2.COLOR_BGR2RGB))
plt.title('Undistorted Image')

plt.show()
