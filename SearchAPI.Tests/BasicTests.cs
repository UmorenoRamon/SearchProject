
namespace SearchAPI.Tests;

public class BasicTests
{
    [Fact]
    public void OnePlusOne_EqualsTwo()
    {
        // Arrange
        int first = 1;
        int second = 1;

        // Act
        int result = first + second;

        // Assert
        Assert.Equal(2, result);
    }
}
