export async function acknowledgeIntro(page){
 const button=page.locator('[data-tutorial-continue]');
 if(await button.isVisible())await button.click();
}
