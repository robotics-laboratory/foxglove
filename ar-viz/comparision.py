import cv2
import numpy as np
import matplotlib.pyplot as plt

camera_matrix = np.array([[1.75816631e+03, 0.00000000e+00, 9.95261535e+02],
                          [0.00000000e+00, 1.74374606e+03, 5.86214872e+02],
                          [0.00000000e+00, 0.00000000e+00, 1.00000000e+00]])
distortion_coefficients = np.array([[1.50497653e-01, -1.14192203e+00, -8.38537659e-04,
                                      -1.96202401e-03, 1.08294422e+00]])

image = cv2.imread('/Users/anastasia/meowmeowX/cv/dataset 4/frame_149.jpg')

h, w = image.shape[:2]

new_camera_matrix, roi = cv2.getOptimalNewCameraMatrix(camera_matrix, distortion_coefficients, (w, h), 1, (w, h))

undistorted_image = cv2.undistort(image, camera_matrix, distortion_coefficients, None, new_camera_matrix)

# 裁剪图像
x, y, w, h = roi
undistorted_image = undistorted_image[y:y+h, x:x+w]

plt.figure(figsize=(10, 5))

plt.subplot(1, 2, 1)
plt.imshow(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
plt.title('Original Image')

plt.subplot(1, 2, 2)
plt.imshow(cv2.cvtColor(undistorted_image, cv2.COLOR_BGR2RGB))
plt.title('Undistorted Image')

plt.show()
