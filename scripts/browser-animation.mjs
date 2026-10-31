// Hover or focus can replace a running CSS transition. Wait for its successor too.
export async function settle(locator) {
  await locator.evaluate(async element => {
    while (element.getAnimations().some(animation => animation.playState === 'running')) {
      await Promise.allSettled(element.getAnimations().map(animation => animation.finished));
    }
  });
}
